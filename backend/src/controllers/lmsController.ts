import { Response } from 'express';
import CourseContent from '../models/CourseContent';
import ModuleProgress from '../models/ModuleProgress';
import AttendanceRecord from '../models/AttendanceRecord';
import CourseAssessment from '../models/CourseAssessment';
import CourseAssessmentSubmission from '../models/CourseAssessmentSubmission';
import TrainingEnrollment from '../models/TrainingEnrollment';
import TrainingRecommendation from '../models/TrainingRecommendation';
import TrainingProgram from '../models/TrainingProgram';
import Notification from '../models/Notification';
import { AuthRequest } from '../middlewares/auth';
import { logAudit } from '../services/auditService';

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
    const { id: programId } = req.params;
    const { answers } = req.body; // answers: [{ questionIndex, selectedOption, answerText, fileUrl }]
    const userId = req.user?._id;

    const assessment = await CourseAssessment.findOne({ programId, isActive: true });
    if (!assessment) {
      res.status(404).json({ success: false, error: 'No active assessment found for this program' });
      return;
    }

    const enrollment = await TrainingEnrollment.findOne({ userId, programId });
    if (!enrollment) {
      res.status(403).json({ success: false, error: 'You are not enrolled in this program' });
      return;
    }

    // Auto-grade MCQs and calculate total score
    let totalScore = 0;
    let maxPossibleScore = 0;
    const gradedAnswers: any[] = [];
    let hasSubjective = false;

    assessment.questions.forEach((q, idx) => {
      maxPossibleScore += q.maxScore || 10;
      const userAns = answers?.find((a: any) => a.questionIndex === idx);

      if (q.type === 'mcq') {
        const isCorrect = userAns && userAns.selectedOption === q.correctAnswer;
        const score = isCorrect ? (q.maxScore || 10) : 0;
        totalScore += score;
        gradedAnswers.push({
          questionIndex: idx,
          selectedOption: userAns?.selectedOption,
          score,
          feedback: isCorrect ? 'Correct' : 'Incorrect',
        });
      } else {
        hasSubjective = true;
        gradedAnswers.push({
          questionIndex: idx,
          answerText: userAns?.answerText,
          fileUrl: userAns?.fileUrl,
          score: 0,
          feedback: 'Pending instructor evaluation',
        });
      }
    });

    const percentageScore = maxPossibleScore > 0 ? Math.round((totalScore / maxPossibleScore) * 100) : 0;
    const passed = percentageScore >= assessment.passingScore;
    const status = hasSubjective ? 'submitted' : 'graded';

    const submission = await CourseAssessmentSubmission.findOneAndUpdate(
      { enrollmentId: enrollment._id },
      {
        assessmentId: assessment._id,
        programId,
        enrollmentId: enrollment._id,
        userId,
        answers: gradedAnswers,
        totalScore,
        maxPossibleScore,
        percentageScore,
        passed,
        status,
        gradedBy: hasSubjective ? undefined : 'system',
        submittedAt: new Date(),
        gradedAt: hasSubjective ? undefined : new Date(),
      },
      { new: true, upsert: true }
    );

    // ─── Closed-Loop Automation ───────────────────────────────────────────────
    if (passed) {
      // 1. Auto-complete enrollment
      enrollment.status = 'completed';
      enrollment.completionDate = new Date();
      await enrollment.save();

      // 2. Pre-fill & link TrainingRecommendation competency score
      const rec = await TrainingRecommendation.findOne({
        $or: [
          { enrollmentId: enrollment._id },
          { facultyId: userId, programId, status: { $in: ['pending', 'enrolled', 'overdue'] } },
        ],
      });

      if (rec) {
        const delta = rec.scoreBeforeRecommendation != null
          ? percentageScore - rec.scoreBeforeRecommendation
          : undefined;

        rec.status = 'completed';
        rec.scoreAfterCompletion = percentageScore;
        rec.improvementDelta = delta;
        rec.enrollmentId = enrollment._id as any;
        await rec.save();

        // Notify HOD of completed assessment with actual course score
        await Notification.create({
          userId: rec.recommendedBy,
          type: 'training',
          title: 'Course Passed — Evidence Score Recorded',
          message: `${req.user?.name} passed the assessment for "${assessment.title}" with score ${percentageScore}%. Competency delta calculated: ${delta != null && delta >= 0 ? '+' : ''}${delta ?? 0} points.`,
          relatedEntityType: 'TrainingRecommendation',
          relatedEntityId: rec._id,
        });
      }

      // 3. Update Program Effectiveness
      const allCompletedRecs = await TrainingRecommendation.find({
        programId,
        status: 'completed',
        improvementDelta: { $ne: null },
      });
      const totalEnrolled = await TrainingEnrollment.countDocuments({ programId });
      const completions = allCompletedRecs.length;
      const avgDelta = completions > 0
        ? allCompletedRecs.reduce((s, r) => s + (r.improvementDelta || 0), 0) / completions
        : 0;
      const completionRate = totalEnrolled > 0 ? Math.round((completions / totalEnrolled) * 100) : 100;

      await TrainingProgram.findByIdAndUpdate(programId, {
        'effectiveness.avgImprovementDelta': Math.round(avgDelta * 10) / 10,
        'effectiveness.totalCompletions': completions,
        'effectiveness.completionRate': completionRate,
        'effectiveness.lastUpdated': new Date(),
      });

      // 4. Notify Faculty
      await Notification.create({
        userId,
        type: 'training',
        title: '🎉 Congratulations! Course Assessment Passed',
        message: `You scored ${percentageScore}% on the assessment for "${assessment.title}". Your training has been certified as Completed!`,
        relatedEntityType: 'TrainingEnrollment',
        relatedEntityId: enrollment._id,
      });
    }

    await logAudit(userId, 'create', 'CourseAssessmentSubmission', submission._id,
      `Submitted course assessment for program ${programId} — Score: ${percentageScore}% (Passed: ${passed})`, null, submission, req.ip, req.headers['user-agent']);

    res.json({
      success: true,
      data: submission,
      summary: { totalScore, maxPossibleScore, percentageScore, passed, status }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// GET /api/v1/training/programs/:id/assessment/mine — Faculty
export const getMySubmission = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id: programId } = req.params;
    const submission = await CourseAssessmentSubmission.findOne({ programId, userId: req.user?._id })
      .populate('assessmentId', 'title passingScore instructions');
    res.json({ success: true, data: submission });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// GET /api/v1/training/programs/:id/assessment/submissions — Organizer / HOD
export const getProgramSubmissions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id: programId } = req.params;
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
    if (!sub) { res.status(404).json({ success: false, error: 'Submission not found' }); return; }

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

    // If passed, auto-complete enrollment & link recommendation
    if (isPassed && updated) {
      await TrainingEnrollment.findByIdAndUpdate(updated.enrollmentId, { status: 'completed', completionDate: new Date() });
      await TrainingRecommendation.findOneAndUpdate(
        { enrollmentId: updated.enrollmentId },
        { status: 'completed', scoreAfterCompletion: percentageScore }
      );
    }

    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};
