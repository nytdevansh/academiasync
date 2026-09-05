import { Response } from 'express';
import CourseContent from '../models/CourseContent';
import ModuleProgress from '../models/ModuleProgress';
import AttendanceRecord from '../models/AttendanceRecord';
import CourseAssessment from '../models/CourseAssessment';
import CourseAssessmentSubmission from '../models/CourseAssessmentSubmission';
import CourseResult from '../models/CourseResult';
import Certificate from '../models/Certificate';
import CompetencyRecord from '../models/CompetencyRecord';
import FacultyProfile from '../models/FacultyProfile';
import User from '../models/User';
import TrainingEnrollment from '../models/TrainingEnrollment';
import TrainingRecommendation from '../models/TrainingRecommendation';
import TrainingProgram from '../models/TrainingProgram';
import Notification from '../models/Notification';
import { AuthRequest } from '../middlewares/auth';
import { logAudit } from '../services/auditService';
import { issueCertificate } from '../services/certificateService';
import { notify } from '../services/notificationService';

// ─── Course Content & Learning Delivery ───────────────────────────────────────

// GET /api/v1/training/programs/:id/content
export const getCourseContent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id: programId } = req.params;
    let content = await CourseContent.findOne({ programId }).populate('createdBy', 'name');

    // If no content exists yet, return default structure
    if (!content) {
      content = {
        programId: programId as any,
        modules: [],
        passingAttendancePercentage: 75,
        externalLmsProvider: 'Internal',
      } as any;
    }

    // If user is enrolled, also fetch their module progress
    let progress: string[] = [];
    if (req.user?._id) {
      const completed = await ModuleProgress.find({ userId: req.user._id, programId }).select('moduleId');
      progress = completed.map(c => c.moduleId);
    }

    res.json({ success: true, data: content, userProgress: progress });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// PUT /api/v1/training/programs/:id/content — Admin / Organizer
export const upsertCourseContent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id: programId } = req.params;
    const { modules, externalCourseUrl, externalLmsProvider, passingAttendancePercentage } = req.body;

    const content = await CourseContent.findOneAndUpdate(
      { programId },
      {
        programId,
        modules: modules || [],
        externalCourseUrl,
        externalLmsProvider: externalLmsProvider || 'Internal',
        passingAttendancePercentage: passingAttendancePercentage || 75,
        createdBy: req.user?._id,
      },
      { new: true, upsert: true }
    );

    await logAudit(req.user?._id, 'update', 'CourseContent', content._id,
      `Updated course modules for program ${programId}`, null, content, req.ip, req.headers['user-agent']);

    res.json({ success: true, data: content });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// POST /api/v1/training/programs/:id/modules/:moduleId/toggle-progress — Faculty
export const toggleModuleProgress = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const programId = req.params.id as string;
    const moduleId = req.params.moduleId as string;
    const userId = req.user?._id;

    const existing = await ModuleProgress.findOne({ userId, programId, moduleId });
    let completed = false;

    if (existing) {
      await ModuleProgress.findByIdAndDelete(existing._id);
      completed = false;
    } else {
      await ModuleProgress.create({ userId, programId: programId as any, moduleId, completedAt: new Date() });
      completed = true;
    }

    // Calculate updated progress percentage for this user
    const content = await CourseContent.findOne({ programId });
    const totalModules = content?.modules?.length || 0;
    const completedCount = await ModuleProgress.countDocuments({ userId, programId });
    const progressPercentage = totalModules > 0 ? Math.round((completedCount / totalModules) * 100) : 0;

    // If async course (no live sessions), auto-update attendance record from module progress
    const enrollment = await TrainingEnrollment.findOne({ userId, programId });
    if (enrollment) {
      const threshold = content?.passingAttendancePercentage || 75;
      const isSatisfied = progressPercentage >= threshold;

      await AttendanceRecord.findOneAndUpdate(
        { enrollmentId: enrollment._id },
        {
          programId,
          enrollmentId: enrollment._id,
          userId,
          attendancePercentage: progressPercentage,
          isSatisfied,
        },
        { upsert: true, new: true }
      );

      if (isSatisfied && enrollment.status === 'approved') {
        enrollment.status = 'attended';
        await enrollment.save();
      }
    }

    res.json({ success: true, data: { moduleId, completed, progressPercentage, totalModules, completedCount } });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ─── Attendance Tracking ──────────────────────────────────────────────────────

// GET /api/v1/training/programs/:id/attendance — Organizer / HOD / Admin
export const getProgramAttendance = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id: programId } = req.params;
    // Get all enrolled faculty
    const enrollments = await TrainingEnrollment.find({ programId, status: { $in: ['approved', 'attended', 'completed'] } })
      .populate('userId', 'name email department')
      .sort({ nominationDate: 1 });

    const enrollmentIds = enrollments.map(e => e._id);
    const records = await AttendanceRecord.find({ enrollmentId: { $in: enrollmentIds } });

    res.json({ success: true, enrollments, attendanceRecords: records });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// POST /api/v1/training/programs/:id/attendance/mark-session — Organizer / HOD
export const markSessionAttendance = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id: programId } = req.params;
    const { sessionDate, sessionTitle, attendees } = req.body; // attendees: [{ enrollmentId, userId, present, notes }]

    if (!Array.isArray(attendees) || attendees.length === 0) {
      res.status(400).json({ success: false, error: 'Please provide attendees roster' });
      return;
    }

    const content = await CourseContent.findOne({ programId });
    const threshold = content?.passingAttendancePercentage || 75;

    for (const item of attendees) {
      let record = await AttendanceRecord.findOne({ enrollmentId: item.enrollmentId });
      if (!record) {
        record = new AttendanceRecord({
          programId,
          enrollmentId: item.enrollmentId,
          userId: item.userId,
          sessions: [],
          attendancePercentage: 0,
          isSatisfied: false,
        });
      }

      // Add or update session
      record.sessions.push({
        sessionDate: new Date(sessionDate || Date.now()),
        sessionTitle: sessionTitle || 'Training Session',
        present: Boolean(item.present),
        markedBy: req.user?._id,
        markedAt: new Date(),
        notes: item.notes,
      });

      const totalSessions = record.sessions.length;
      const presentCount = record.sessions.filter(s => s.present).length;
      record.attendancePercentage = totalSessions > 0 ? Math.round((presentCount / totalSessions) * 100) : 0;
      record.isSatisfied = record.attendancePercentage >= threshold;
      await record.save();

      // If satisfied and still approved, advance to 'attended'
      if (record.isSatisfied) {
        await TrainingEnrollment.findByIdAndUpdate(item.enrollmentId, { status: 'attended' });
      }
    }

    await logAudit(req.user?._id, 'update', 'AttendanceRecord', programId as any,
      `Marked attendance for ${attendees.length} faculty members on session "${sessionTitle}"`, null, null, req.ip, req.headers['user-agent']);

    res.json({ success: true, message: `Attendance marked for ${attendees.length} attendees` });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// GET /api/v1/training/programs/:id/attendance/mine — Faculty
export const getMyAttendance = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id: programId } = req.params;
    const enrollment = await TrainingEnrollment.findOne({ userId: req.user?._id, programId });
    if (!enrollment) {
      res.status(404).json({ success: false, error: 'Enrollment not found' });
      return;
    }

    const record = await AttendanceRecord.findOne({ enrollmentId: enrollment._id });
    res.json({ success: true, data: record, enrollmentStatus: enrollment.status });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ─── Course Assessments & Performance Grading ─────────────────────────────────

// GET /api/v1/training/programs/:id/assessment
export const getCourseAssessment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id: programId } = req.params;
    const assessment = await CourseAssessment.findOne({ programId, isActive: true });

    if (!assessment) {
      res.json({ success: true, data: null });
      return;
    }

    // If requesting user is faculty, mask correctAnswer for test-taking
    const isInstructor = ['hod', 'dean', 'administrator'].includes(req.user?.role || '');
    if (!isInstructor) {
      const sanitizedQuestions = assessment.questions.map((q: any) => ({
        _id: q._id,
        prompt: q.prompt,
        type: q.type,
        options: q.options,
        maxScore: q.maxScore,
        rubricGuide: q.rubricGuide,
      }));
      res.json({
        success: true,
        data: {
          _id: assessment._id,
          programId: assessment.programId,
          title: assessment.title,
          instructions: assessment.instructions,
          passingScore: assessment.passingScore,
          timeLimitMinutes: assessment.timeLimitMinutes,
          questions: sanitizedQuestions,
        },
      });
      return;
    }

    res.json({ success: true, data: assessment });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// PUT /api/v1/training/programs/:id/assessment — Admin / Organizer
export const upsertCourseAssessment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id: programId } = req.params;
    const { title, instructions, passingScore, timeLimitMinutes, questions } = req.body;

    const assessment = await CourseAssessment.findOneAndUpdate(
      { programId },
      {
        programId,
        title: title || 'Course Completion Assessment',
        instructions,
        passingScore: passingScore ?? 60,
        timeLimitMinutes: timeLimitMinutes ?? 45,
        questions: questions || [],
        createdBy: req.user?._id,
        isActive: true,
      },
      { new: true, upsert: true }
    );

    await logAudit(req.user?._id, 'update', 'CourseAssessment', assessment._id,
      `Configured course assessment for program ${programId}`, null, assessment, req.ip, req.headers['user-agent']);

    res.json({ success: true, data: assessment });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};
// POST /api/v1/training/programs/:id/assessment/submit — Faculty takes test
export const submitCourseAssessment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const programId = (Array.isArray(req.params.id) ? req.params.id[0] : req.params.id) as string;
    const { answers, timeSpentSeconds } = req.body; // answers: [{ questionIndex, selectedOption, answerText, fileUrl }]
    const userId = req.user?._id;

    const assessment = await CourseAssessment.findOne({ programId, isActive: true });
    if (!assessment) {
      res.status(404).json({ success: false, error: 'No active assessment found for this program' });
      return;
    }

    const program = await TrainingProgram.findById(programId);
    const maxAttempts = program?.maxAttempts || 3;
    const cooldownHours = program?.cooldownHours ?? 24;
    const cooldownMs = cooldownHours * 3600000;
    const cutoff = new Date(Date.now() - cooldownMs);

    const currentEnrollment = await TrainingEnrollment.findOne({ userId, programId });
    if (!currentEnrollment) {
      res.status(403).json({ success: false, error: 'You are not enrolled in this course' });
      return;
    }

    if (currentEnrollment.status === 'certified') {
      res.status(400).json({ success: false, error: 'You are already certified in this course' });
      return;
    }

    if (!['attended', 'completed'].includes(currentEnrollment.status)) {
      res.status(403).json({
        success: false,
        error: 'Complete the training session before attempting the assessment.',
      });
      return;
    }

    // ── Atomic attempt reservation (incorporates session attendance gate, maxAttempts, and failed-cooldown) ──
    const reservedEnrollment = await TrainingEnrollment.findOneAndUpdate(
      {
        _id: currentEnrollment._id,
        status: { $in: ['attended', 'completed'] },
        attemptsCount: { $lt: maxAttempts },
        $or: [
          { lastFailedAttemptAt: { $exists: false } },
          { lastFailedAttemptAt: null },
          { lastFailedAttemptAt: { $lte: cutoff } },
        ],
      },
      { $inc: { attemptsCount: 1 } },
      { new: true }
    );

    if (!reservedEnrollment) {
      // Diagnostic read for informative user messaging
      const refreshed = await TrainingEnrollment.findById(currentEnrollment._id);
      if (refreshed?.status === 'certified') {
        res.status(400).json({ success: false, error: 'You are already certified in this course' });
        return;
      }
      if (!['attended', 'completed'].includes(refreshed?.status || '')) {
        res.status(403).json({
          success: false,
          error: 'Complete the training session before attempting the assessment.',
        });
        return;
      }
      if (refreshed && refreshed.attemptsCount >= maxAttempts) {
        res.status(400).json({
          success: false,
          error: `Maximum attempts (${maxAttempts}) reached for this course assessment. Contact HOD/Admin for a retake reset.`,
        });
        return;
      }
      if (refreshed?.lastFailedAttemptAt && Date.now() - refreshed.lastFailedAttemptAt.getTime() < cooldownMs) {
        const hoursLeft = Math.ceil((cooldownMs - (Date.now() - refreshed.lastFailedAttemptAt.getTime())) / 3600000);
        res.status(429).json({
          success: false,
          error: `Cooldown period active after a failed attempt. You can retake this assessment in ${hoursLeft} hour(s).`,
        });
        return;
      }
      res.status(400).json({ success: false, error: 'Unable to start assessment attempt at this time.' });
      return;
    }

    const attemptNumber = reservedEnrollment.attemptsCount;

    // Auto-grade MCQs and format answers (capping free text to 2000 chars)
    let totalScore = 0;
    let maxPossibleScore = 0;
    const gradedAnswers: any[] = [];
    let hasSubjective = false;

    assessment.questions.forEach((q, idx) => {
      const qMax = q.maxScore || 10;
      maxPossibleScore += qMax;
      const userAns = answers?.find((a: any) => a.questionIndex === idx);

      if (q.type === 'mcq') {
        const isCorrect = userAns && userAns.selectedOption === q.correctAnswer;
        const score = isCorrect ? qMax : 0;
        totalScore += score;
        gradedAnswers.push({
          questionIndex: idx,
          prompt: q.prompt,
          type: 'mcq',
          selectedOption: userAns?.selectedOption,
          score,
          maxScore: qMax,
          feedback: isCorrect ? 'Correct' : 'Incorrect',
          isCorrect,
        });
      } else {
        hasSubjective = true;
        const answerTextCapped = userAns?.answerText ? String(userAns.answerText).slice(0, 2000) : '';
        gradedAnswers.push({
          questionIndex: idx,
          prompt: q.prompt,
          type: q.type,
          answerText: answerTextCapped,
          fileUrl: userAns?.fileUrl,
          score: 0,
          maxScore: qMax,
          feedback: 'Pending instructor evaluation',
          isCorrect: undefined,
        });
      }
    });

    const percentageScore = maxPossibleScore > 0 ? Math.round((totalScore / maxPossibleScore) * 100) : 0;
    const passingThreshold = assessment.passingScore ?? program?.passingScore ?? 60;

    // If subjective questions exist, passed is null (pending). Otherwise determine pass/fail immediately.
    const passed = hasSubjective ? null : percentageScore >= passingThreshold;
    const status = hasSubjective ? 'pending' : 'graded';

    // ── First-Class CourseResult Record ──
    const courseResult = await CourseResult.create({
      enrollmentId: reservedEnrollment._id,
      teacherId: userId,
      courseId: programId,
      assessmentId: assessment._id,
      attemptNumber,
      score: percentageScore,
      totalScore,
      maxPossibleScore,
      passingScore: passingThreshold,
      passed,
      status,
      gradedBy: hasSubjective ? undefined : 'system',
      gradedAt: hasSubjective ? undefined : new Date(),
      answers: gradedAnswers,
      timeSpentSeconds,
      completedAt: new Date(),
    });

    // Update legacy CourseAssessmentSubmission for existing grader dashboards
    const submission = await CourseAssessmentSubmission.findOneAndUpdate(
      { enrollmentId: reservedEnrollment._id },
      {
        assessmentId: assessment._id,
        programId,
        enrollmentId: reservedEnrollment._id,
        userId,
        answers: gradedAnswers,
        totalScore,
        maxPossibleScore,
        percentageScore,
        passed: passed === true,
        status: hasSubjective ? 'submitted' : 'graded',
        gradedBy: hasSubjective ? undefined : 'system',
        submittedAt: new Date(),
        gradedAt: hasSubjective ? undefined : new Date(),
      },
      { new: true, upsert: true }
    );

    // ── Synchronous Closed-Loop Certification (100% MCQ / Auto-Graded) ──
    if (passed === true) {
      reservedEnrollment.status = 'certified';
      reservedEnrollment.completionDate = new Date();
      reservedEnrollment.lastPassedAttemptAt = new Date();
      reservedEnrollment.lastFailedAttemptAt = undefined;

      // Check for previously revoked certificate for audit supersedes linkage
      const prevCert = await Certificate.findOne({
        enrollmentId: reservedEnrollment._id,
        status: 'revoked',
      }).sort({ createdAt: -1 });

      const teacherUser = await User.findById(userId).populate('department');
      const dept = teacherUser?.department as any;
      const teacher = (teacherUser || req.user) as any;

      const cert = await issueCertificate({
        teacher,
        course: program || ({ _id: programId, title: assessment.title } as any),
        enrollmentId: reservedEnrollment._id,
        resultId: courseResult._id,
        departmentName: dept?.name || 'General',
        departmentCode: dept?.code || 'GEN',
        supersedesId: prevCert?._id,
      });

      courseResult.certificateId = cert._id as any;
      await courseResult.save();

      reservedEnrollment.certificateId = cert._id as any;
      await reservedEnrollment.save();

      // Evidentiary Competency Gap Record
      if (program?.skillAreaIds && program.skillAreaIds.length > 0) {
        await CompetencyRecord.updateMany(
          { userId, skillArea: { $in: program.skillAreaIds } },
          {
            $push: {
              assessments: {
                source: 'training_course',
                score: percentageScore,
                date: new Date(),
                notes: `Certified in course: ${program.title} (Score: ${percentageScore}%)`,
              },
            },
          }
        );
      }

      // Faculty Profile certification history
      await FacultyProfile.findOneAndUpdate(
        { userId },
        {
          $push: {
            certifications: {
              name: program?.title || assessment.title,
              issuingBody: program?.organizer || 'AcademiaSync Academy',
              issueDate: cert.issuedDate,
              expiryDate: cert.expiryDate,
              certificateUrl: `/api/v1/certificates/verify/${cert.verificationToken}`,
            },
          },
        }
      );

      // Workflow recommendation status
      await TrainingRecommendation.updateMany(
        { facultyId: userId, programId },
        { status: 'completed', enrollmentId: reservedEnrollment._id }
      );

      // Notifications (Dual-channel: In-app + Email)
      await notify({
        userId: userId!,
        type: 'training',
        title: '🎉 Congratulations! Course Assessment Passed & Certified',
        message: `You scored ${percentageScore}% on the assessment for "${assessment.title}". Your official Certificate ${cert.certificateNumber} has been issued!`,
        channels: ['in_app', 'email'],
        emailData: {
          template: 'certificationPassed',
          subject: `🎓 Official Certification Earned: ${program?.title || assessment.title}`,
          variables: {
            courseTitle: program?.title || assessment.title,
            score: percentageScore,
            passingScore: assessment.passingScore,
            certificateNumber: cert.certificateNumber,
            verificationUrl: `${process.env.CLIENT_URL || 'http://localhost:5173'}/verify/${cert.verificationToken}`,
            verificationToken: cert.verificationToken,
          },
        },
        relatedEntityType: 'Certificate',
        relatedEntityId: cert._id as any,
      });

      if (dept?.hodRef) {
        await notify({
          userId: dept.hodRef,
          type: 'training',
          title: 'Faculty Certification Achieved',
          message: `${req.user?.name} has achieved official certification in "${program?.title || assessment.title}" with score ${percentageScore}%.`,
          channels: ['in_app'],
          relatedEntityType: 'Certificate',
          relatedEntityId: cert._id as any,
        });
      }
    } else if (passed === false) {
      // Failed attempt: record failed timestamp for cooldown calculation
      reservedEnrollment.lastFailedAttemptAt = new Date();
      await reservedEnrollment.save();
    } else {
      // Pending subjective evaluation
      await reservedEnrollment.save();
    }

    await logAudit(
      userId,
      'create',
      'CourseResult',
      courseResult._id,
      `Assessment attempt ${attemptNumber} for course ${programId} — Score: ${percentageScore}% (Passed: ${passed})`,
      null,
      courseResult,
      req.ip,
      req.headers['user-agent']
    );

    res.json({
      success: true,
      data: {
        result: courseResult,
        submission,
        attemptNumber,
        remainingAttempts: Math.max(0, maxAttempts - attemptNumber),
        passed,
        status,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// GET /api/v1/training/programs/:id/assessment/submissions/mine — Faculty gets submission
export const getMySubmission = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id: programId } = req.params;
    const userId = req.user?._id;

    const [submission, results] = await Promise.all([
      CourseAssessmentSubmission.findOne({ programId, userId }).populate('assessmentId', 'title passingScore'),
      CourseResult.find({ courseId: programId, teacherId: userId }).populate('certificateId').sort({ attemptNumber: 1 }),
    ]);

    res.json({ success: true, data: submission, results });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// GET /api/v1/training/programs/:id/assessment/submissions — Instructor lists all submissions
export const getProgramSubmissions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const programId = (Array.isArray(req.params.id) ? req.params.id[0] : req.params.id) as string;
    const submissions = await CourseAssessmentSubmission.find({ programId })
      .populate('userId', 'name email department')
      .populate('assessmentId', 'title passingScore')
      .sort({ submittedAt: -1 });

    res.json({ success: true, data: submissions });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// PUT /api/v1/training/programs/:id/assessment/submissions/:subId/grade — Instructor grades subjective
export const gradeSubmission = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { subId } = req.params;
    const { answers, totalScore, passed } = req.body;

    const sub = await CourseAssessmentSubmission.findById(subId);
    if (!sub) {
      res.status(404).json({ success: false, error: 'Submission not found' });
      return;
    }

    const percentageScore = sub.maxPossibleScore > 0 ? Math.round((totalScore / sub.maxPossibleScore) * 100) : 0;
    const isPassed = passed !== undefined ? passed : percentageScore >= 60;

    const updated = await CourseAssessmentSubmission.findByIdAndUpdate(
      subId,
      {
        answers: answers || sub.answers,
        totalScore,
        percentageScore,
        passed: isPassed,
        status: 'graded',
        gradedBy: req.user?._id,
        gradedAt: new Date(),
      },
      { new: true }
    );

    // Update corresponding CourseResult
    const courseResult = await CourseResult.findOne({
      enrollmentId: sub.enrollmentId,
      status: 'pending',
    }).sort({ attemptNumber: -1 });

    if (courseResult) {
      courseResult.totalScore = totalScore;
      courseResult.score = percentageScore;
      courseResult.passed = isPassed;
      courseResult.status = 'graded';
      courseResult.gradedBy = req.user?._id as any;
      courseResult.gradedAt = new Date();
      if (answers) courseResult.answers = answers;
      await courseResult.save();
    }

    const enrollment = await TrainingEnrollment.findById(sub.enrollmentId);
    const program = await TrainingProgram.findById(sub.programId);

    // ── If now passed, trigger certification & closed-loop sync ──
    if (isPassed && enrollment && enrollment.status !== 'certified') {
      enrollment.status = 'certified';
      enrollment.completionDate = new Date();
      enrollment.lastPassedAttemptAt = new Date();
      enrollment.lastFailedAttemptAt = undefined;

      const prevCert = await Certificate.findOne({
        enrollmentId: enrollment._id,
        status: 'revoked',
      }).sort({ createdAt: -1 });

      const teacherUser = await User.findById(enrollment.userId).populate('department');
      const dept = teacherUser?.department as any;

      const cert = await issueCertificate({
        teacher: teacherUser || { _id: enrollment.userId, name: 'Faculty Member' },
        course: program || { _id: sub.programId, title: 'Course Assessment' },
        enrollmentId: enrollment._id,
        resultId: (courseResult?._id || sub._id) as any,
        departmentName: dept?.name || 'General',
        departmentCode: dept?.code || 'GEN',
        supersedesId: prevCert?._id,
      });

      if (courseResult) {
        courseResult.certificateId = cert._id as any;
        await courseResult.save();
      }

      enrollment.certificateId = cert._id as any;
      await enrollment.save();

      // Evidentiary Competency Gap Record
      if (program?.skillAreaIds && program.skillAreaIds.length > 0) {
        await CompetencyRecord.updateMany(
          { userId: enrollment.userId, skillArea: { $in: program.skillAreaIds } },
          {
            $push: {
              assessments: {
                source: 'training_course',
                score: percentageScore,
                date: new Date(),
                notes: `Certified in course: ${program.title} (Score: ${percentageScore}%)`,
              },
            },
          }
        );
      }

      // Faculty Profile certification history
      await FacultyProfile.findOneAndUpdate(
        { userId: enrollment.userId },
        {
          $push: {
            certifications: {
              name: program?.title || 'Course Certification',
              issuingBody: program?.organizer || 'AcademiaSync Academy',
              issueDate: cert.issuedDate,
              expiryDate: cert.expiryDate,
              certificateUrl: `/api/v1/certificates/verify/${cert.verificationToken}`,
            },
          },
        }
      );

      // Workflow recommendation status
      await TrainingRecommendation.updateMany(
        { facultyId: enrollment.userId, programId: sub.programId },
        { status: 'completed', enrollmentId: enrollment._id }
      );
    } else if (!isPassed && enrollment) {
      enrollment.lastFailedAttemptAt = new Date();
      await enrollment.save();
    }

    // Dispatch Grading Completed Notification (in_app + email)
    if (enrollment) {
      const feedbackText = answers.find((a: any) => a.feedback)?.feedback || 'Review question breakdown in course workspace.';
      await notify({
        userId: enrollment.userId,
        type: 'training',
        title: isPassed ? 'Assessment Graded: Passed & Certified ✓' : 'Assessment Graded: Results Available',
        message: `Your assessment submission for "${program?.title || 'Training Program'}" was graded. Final Score: ${percentageScore}%.`,
        channels: ['in_app', 'email'],
        emailData: {
          template: 'gradingCompleted',
          subject: `Assessment Evaluated: ${program?.title || 'Training Program'}`,
          variables: {
            courseTitle: program?.title || 'Course Assessment',
            score: percentageScore,
            outcome: isPassed ? 'Passed & Certified' : 'Below Passing Benchmark',
            feedback: feedbackText,
            courseUrl: `${process.env.CLIENT_URL || 'http://localhost:5173'}/training/${sub.programId}/learn`,
          },
        },
        relatedEntityType: 'CourseAssessmentSubmission',
        relatedEntityId: sub._id,
      });
    }

    res.json({ success: true, data: updated, courseResult });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// GET /api/v1/training/programs/:id/results/mine — Faculty views all attempt results & feedback
export const getMyCourseResults = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const programId = (Array.isArray(req.params.id) ? req.params.id[0] : req.params.id) as string;
    const userId = req.user?._id;

    const [results, enrollment] = await Promise.all([
      CourseResult.find({ courseId: programId, teacherId: userId })
        .populate('certificateId')
        .sort({ attemptNumber: 1 }),
      TrainingEnrollment.findOne({ programId, userId }).populate('certificateId'),
    ]);

    res.json({
      success: true,
      data: {
        results,
        enrollment,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};
