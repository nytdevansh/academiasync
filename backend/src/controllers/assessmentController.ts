import { Response } from 'express';
import mongoose from 'mongoose';
import Assessment, { IAssessment } from '../models/Assessment';
import AssessmentResponse from '../models/AssessmentResponse';
import User from '../models/User';
import Department from '../models/Department';
import Notification from '../models/Notification';
import CompetencyRecord from '../models/CompetencyRecord';
import { AuthRequest } from '../middlewares/auth';
import { logAudit } from '../services/auditService';

// ── 1. Create Assessment ───────────────────────────────────────────────────────
export const createAssessment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      title,
      description,
      topic,
      targetScope,
      questions,
      settings,
      isTemplate,
      status,
    } = req.body;

    if (!title || !questions || !Array.isArray(questions) || questions.length === 0) {
      res.status(400).json({ success: false, error: 'Title and at least one question are required' });
      return;
    }

    const userRole = req.user?.role as 'hod' | 'dean' | 'administrator';
    const userDept = req.user?.department ? req.user.department.toString() : null;

    // Validate HOD scoping: HOD can only target their own department or faculty in their dept
    let validatedScope = targetScope || { type: 'all' };
    if (userRole === 'hod') {
      if (!userDept) {
        res.status(403).json({ success: false, error: 'HOD user does not have an assigned department' });
        return;
      }
      if (validatedScope.type === 'all') {
        validatedScope = { type: 'department', targetIds: [req.user?.department] };
      } else if (validatedScope.type === 'department') {
        const targetIds = (validatedScope.targetIds || []).map((id: any) => id.toString());
        if (targetIds.some((id: string) => id !== userDept)) {
          res.status(403).json({ success: false, error: 'HODs can only target their own department' });
          return;
        }
      } else if (validatedScope.type === 'individual') {
        // Confirm all target users belong to HOD's department
        const targetUsers = await User.find({ _id: { $in: validatedScope.targetIds } });
        const invalidUser = targetUsers.find(u => u.department?.toString() !== userDept);
        if (invalidUser) {
          res.status(403).json({ success: false, error: `User ${invalidUser.name} does not belong to your department` });
          return;
        }
      }
    }

    const assessment = await Assessment.create({
      title,
      description,
      topic: topic || 'General',
      createdBy: req.user?._id,
      createdByRole: userRole,
      targetScope: validatedScope,
      questions,
      settings: {
        isGraded: settings?.isGraded ?? true,
        isAnonymous: settings?.isAnonymous ?? false,
        allowRetake: settings?.allowRetake ?? false,
        maxAttempts: settings?.maxAttempts || 1,
        timeLimitMinutes: settings?.timeLimitMinutes,
        dueDate: settings?.dueDate ? new Date(settings.dueDate) : undefined,
      },
      status: status === 'published' ? 'published' : 'draft',
      isTemplate: Boolean(isTemplate),
    });

    await logAudit(
      req.user?._id,
      'create',
      'Assessment',
      assessment._id,
      `Created assessment "${assessment.title}" (${assessment.status})`,
      undefined,
      assessment.toObject()
    );

    // If directly created as published, trigger notifications
    if (assessment.status === 'published') {
      await fanoutAssessmentNotifications(assessment, req.user?.name || 'Academic Administration');
    }

    res.status(201).json({ success: true, data: assessment });
  } catch (error: any) {
    console.error('Error creating assessment:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to create assessment' });
  }
};

// ── Helper: Notification Fanout ────────────────────────────────────────────────
const fanoutAssessmentNotifications = async (assessment: IAssessment, publisherName: string) => {
  try {
    let targetUserIds: mongoose.Types.ObjectId[] = [];
    const scope = assessment.targetScope;

    if (scope.type === 'all') {
      const users = await User.find({ role: { $in: ['faculty_member', 'hod'] }, status: 'active' }).select('_id');
      targetUserIds = users.map(u => u._id as mongoose.Types.ObjectId);
    } else if (scope.type === 'department' && scope.targetIds?.length) {
      const users = await User.find({ department: { $in: scope.targetIds }, status: 'active' }).select('_id');
      targetUserIds = users.map(u => u._id as mongoose.Types.ObjectId);
    } else if (scope.type === 'individual' && scope.targetIds?.length) {
      targetUserIds = scope.targetIds;
    } else if (scope.type === 'role') {
      const users = await User.find({ role: 'faculty_member', status: 'active' }).select('_id');
      targetUserIds = users.map(u => u._id as mongoose.Types.ObjectId);
    }

    const dueStr = assessment.settings.dueDate ? ` (Due: ${new Date(assessment.settings.dueDate).toLocaleDateString()})` : '';
    const notifications = targetUserIds.map(userId => ({
      userId,
      type: 'system' as const,
      title: `New Assessment: ${assessment.title}`,
      message: `${publisherName} published a new ${assessment.settings.isGraded ? 'assessment' : 'survey'}: "${assessment.title}"${dueStr}.`,
      dueDate: assessment.settings.dueDate,
      relatedEntityType: 'Assessment',
      relatedEntityId: assessment._id,
      status: 'unread' as const,
    }));

    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }
  } catch (err) {
    console.error('Failed to fanout assessment notifications:', err);
  }
};

// ── 2. List Assessments ────────────────────────────────────────────────────────
export const getAssessments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, topic, isTemplate, search } = req.query;
    const userRole = req.user?.role;
    const userId = req.user?._id;
    const userDept = req.user?.department;

    let filter: any = {};

    if (status) filter.status = status;
    if (topic) filter.topic = topic;
    if (isTemplate !== undefined) filter.isTemplate = isTemplate === 'true';
    if (search) {
      filter.$or = [
        { title: { $regex: String(search), $options: 'i' } },
        { description: { $regex: String(search), $options: 'i' } },
        { topic: { $regex: String(search), $options: 'i' } },
      ];
    }

    // Role-based scoping
    if (userRole === 'faculty_member') {
      // Faculty members see published or closed assessments targeted to them, plus templates if requested
      if (filter.isTemplate) {
        filter.isTemplate = true;
      } else {
        filter.status = filter.status ? filter.status : { $in: ['published', 'closed'] };
        filter.$and = filter.$and || [];
        filter.$and.push({
          $or: [
            { 'targetScope.type': 'all' },
            { 'targetScope.type': 'role' },
            { 'targetScope.type': 'department', 'targetScope.targetIds': userDept },
            { 'targetScope.type': 'individual', 'targetScope.targetIds': userId },
          ],
        });
      }
    } else if (userRole === 'hod') {
      // HODs see what they created, or targeting their dept, or all published
      if (!filter.createdBy && !filter.isTemplate) {
        filter.$or = [
          { createdBy: userId },
          { 'targetScope.type': 'department', 'targetScope.targetIds': userDept },
          { 'targetScope.type': 'all' },
        ];
      }
    } else if (userRole === 'hr') {
      // HR can view published, closed, or templates for reporting
      if (!filter.status && !filter.isTemplate) {
        filter.status = { $in: ['published', 'closed'] };
      }
    }
    // Dean and Admin can view everything without restriction

    const assessments = await Assessment.find(filter)
      .populate('createdBy', 'name email role')
      .populate('targetScope.targetIds', 'name code')
      .sort({ createdAt: -1 });

    // For faculty or general view, attach user's own response status
    const assessmentIds = assessments.map(a => a._id);
    const userResponses = await AssessmentResponse.find({
      assessmentId: { $in: assessmentIds },
      facultyId: userId,
    }).sort({ attemptNumber: -1 });

    const responseMap = new Map<string, any>();
    userResponses.forEach(r => {
      const key = r.assessmentId.toString();
      if (!responseMap.has(key)) {
        responseMap.set(key, r);
      }
    });

    const responseCounts = await AssessmentResponse.aggregate([
      { $match: { assessmentId: { $in: assessmentIds } } },
      { $group: { _id: '$assessmentId', totalResponses: { $sum: 1 } } },
    ]);
    const countMap = new Map<string, number>();
    responseCounts.forEach(c => countMap.set(c._id.toString(), c.totalResponses));

    const enriched = assessments.map(a => {
      const userLatest = responseMap.get(a._id.toString());
      return {
        ...a.toObject(),
        totalSubmissions: countMap.get(a._id.toString()) || 0,
        mySubmission: userLatest
          ? {
              responseId: userLatest._id,
              attemptNumber: userLatest.attemptNumber,
              status: userLatest.status,
              totalScore: userLatest.totalScore,
              maxScore: userLatest.maxScore,
              submittedAt: userLatest.submittedAt,
            }
          : null,
      };
    });

    res.json({ success: true, data: enriched });
  } catch (error: any) {
    console.error('Error fetching assessments:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to fetch assessments' });
  }
};

// ── 3. Get Assessment Detail ───────────────────────────────────────────────────
export const getAssessmentById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const assessment = await Assessment.findById(id)
      .populate('createdBy', 'name email role')
      .populate('targetScope.targetIds', 'name code');

    if (!assessment) {
      res.status(404).json({ success: false, error: 'Assessment not found' });
      return;
    }

    const userRole = req.user?.role;
    const userId = req.user?._id;

    // Fetch faculty user's past responses for this assessment
    const myResponses = await AssessmentResponse.find({
      assessmentId: id,
      facultyId: userId,
    }).sort({ attemptNumber: -1 });

    const isCreatorOrAdmin =
      userRole === 'administrator' ||
      userRole === 'dean' ||
      (userRole === 'hod' && assessment.createdBy.toString() === userId?.toString());

    const assessmentObj = assessment.toObject();

    // Security Masking: If faculty is taking a live graded assessment and has not completed review,
    // strip the correctAnswer from the returned questions
    const hasCompletedReview = myResponses.some(r => r.status === 'reviewed');
    if (!isCreatorOrAdmin && (!assessment.settings.isGraded || !hasCompletedReview)) {
      assessmentObj.questions = assessmentObj.questions.map((q: any) => {
        const { correctAnswer, ...rest } = q;
        return rest;
      });
    }

    res.json({
      success: true,
      data: {
        ...assessmentObj,
        myResponses,
      },
    });
  } catch (error: any) {
    console.error('Error fetching assessment:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to fetch assessment' });
  }
};

// ── 4. Update Assessment (Draft only) ──────────────────────────────────────────
export const updateAssessment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const assessment = await Assessment.findById(id);

    if (!assessment) {
      res.status(404).json({ success: false, error: 'Assessment not found' });
      return;
    }

    const userRole = req.user?.role;
    const isOwner = assessment.createdBy.toString() === req.user?._id.toString();
    if (userRole !== 'administrator' && !isOwner) {
      res.status(403).json({ success: false, error: 'Not authorized to edit this assessment' });
      return;
    }

    // Check if responses already exist
    const responseCount = await AssessmentResponse.countDocuments({ assessmentId: id });
    if (responseCount > 0 && req.body.questions) {
      res.status(400).json({
        success: false,
        error: 'Cannot modify questions because responses have already been submitted.',
      });
      return;
    }

    const previousValue = assessment.toObject();
    const updated = await Assessment.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });

    await logAudit(
      req.user?._id,
      'update',
      'Assessment',
      assessment._id,
      `Updated assessment "${assessment.title}"`,
      previousValue,
      updated?.toObject()
    );

    res.json({ success: true, data: updated });
  } catch (error: any) {
    console.error('Error updating assessment:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to update assessment' });
  }
};

// ── 5. Delete Assessment (Draft only) ──────────────────────────────────────────
export const deleteAssessment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const assessment = await Assessment.findById(id);

    if (!assessment) {
      res.status(404).json({ success: false, error: 'Assessment not found' });
      return;
    }

    if (assessment.status !== 'draft') {
      res.status(400).json({ success: false, error: 'Only draft assessments can be deleted' });
      return;
    }

    const responseCount = await AssessmentResponse.countDocuments({ assessmentId: id });
    if (responseCount > 0) {
      res.status(400).json({ success: false, error: 'Cannot delete assessment with existing submissions' });
      return;
    }

    await Assessment.findByIdAndDelete(id);

    await logAudit(
      req.user?._id,
      'delete',
      'Assessment',
      assessment._id,
      `Deleted draft assessment "${assessment.title}"`,
      assessment.toObject(),
      undefined
    );

    res.json({ success: true, message: 'Assessment deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting assessment:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to delete assessment' });
  }
};

// ── 6. Publish Assessment ──────────────────────────────────────────────────────
export const publishAssessment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const assessment = await Assessment.findById(id);

    if (!assessment) {
      res.status(404).json({ success: false, error: 'Assessment not found' });
      return;
    }

    if (assessment.status === 'published') {
      res.status(400).json({ success: false, error: 'Assessment is already published' });
      return;
    }

    assessment.status = 'published';
    await assessment.save();

    await fanoutAssessmentNotifications(assessment, req.user?.name || 'Administration');

    await logAudit(
      req.user?._id,
      'update',
      'Assessment',
      assessment._id,
      `Published assessment "${assessment.title}"`,
      { status: 'draft' },
      { status: 'published' }
    );

    res.json({ success: true, data: assessment, message: 'Assessment published and notifications dispatched' });
  } catch (error: any) {
    console.error('Error publishing assessment:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to publish assessment' });
  }
};

// ── 7. Close Assessment ────────────────────────────────────────────────────────
export const closeAssessment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const assessment = await Assessment.findById(id);

    if (!assessment) {
      res.status(404).json({ success: false, error: 'Assessment not found' });
      return;
    }

    assessment.status = 'closed';
    await assessment.save();

    await logAudit(
      req.user?._id,
      'update',
      'Assessment',
      assessment._id,
      `Closed assessment "${assessment.title}"`,
      { status: 'published' },
      { status: 'closed' }
    );

    res.json({ success: true, data: assessment, message: 'Assessment closed successfully' });
  } catch (error: any) {
    console.error('Error closing assessment:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to close assessment' });
  }
};

// ── 8. Start Assessment Attempt (Server-side Timer Initialization) ─────────────
export const startAssessment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const assessment = await Assessment.findById(id);

    if (!assessment) {
      res.status(404).json({ success: false, error: 'Assessment not found' });
      return;
    }

    if (assessment.status !== 'published') {
      res.status(400).json({ success: false, error: 'This assessment is not currently accepting submissions' });
      return;
    }

    const userId = req.user?._id;
    const existingCount = await AssessmentResponse.countDocuments({
      assessmentId: id,
      facultyId: userId,
    });

    if (existingCount >= 1 && !assessment.settings.allowRetake) {
      res.status(400).json({ success: false, error: 'Retakes are not permitted for this assessment' });
      return;
    }

    if (assessment.settings.maxAttempts && existingCount >= assessment.settings.maxAttempts) {
      res.status(400).json({ success: false, error: `Maximum allowed attempts (${assessment.settings.maxAttempts}) reached` });
      return;
    }

    const startedAt = new Date();
    const attemptNumber = existingCount + 1;

    res.json({
      success: true,
      data: {
        assessmentId: id,
        attemptNumber,
        startedAt,
        timeLimitMinutes: assessment.settings.timeLimitMinutes,
      },
    });
  } catch (error: any) {
    console.error('Error starting assessment:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to start assessment' });
  }
};

// ── 9. Submit Response (Auto-Grading + Server Timeout Validation) ───────────────
export const submitResponse = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { answers, startedAt, attemptNumber: reqAttempt } = req.body;

    const assessment = await Assessment.findById(id);
    if (!assessment) {
      res.status(404).json({ success: false, error: 'Assessment not found' });
      return;
    }

    if (assessment.status !== 'published') {
      res.status(400).json({ success: false, error: 'This assessment is not open for submission' });
      return;
    }

    const userId = req.user?._id;
    const existingCount = await AssessmentResponse.countDocuments({
      assessmentId: id,
      facultyId: userId,
    });

    if (existingCount >= 1 && !assessment.settings.allowRetake) {
      res.status(400).json({ success: false, error: 'You have already submitted a response for this assessment' });
      return;
    }

    const attemptNumber = reqAttempt || existingCount + 1;

    // Server-side Timer Validation
    const now = new Date();
    let timeTakenSeconds = 0;
    if (startedAt) {
      const start = new Date(startedAt);
      timeTakenSeconds = Math.max(1, Math.floor((now.getTime() - start.getTime()) / 1000));

      if (assessment.settings.timeLimitMinutes) {
        const allowedMaxSeconds = assessment.settings.timeLimitMinutes * 60 + 90; // 90s latency grace
        if (timeTakenSeconds > allowedMaxSeconds) {
          console.warn(`Late submission recorded for user ${userId}: took ${timeTakenSeconds}s, limit was ${allowedMaxSeconds}s`);
        }
      }
    }

    // Auto-Grading Calculation
    let totalScore = 0;
    let maxScore = 0;
    let hasPendingTextQuestions = false;
    const processedAnswers: any[] = [];
    const competencyScoreAccumulator: Record<string, { scored: number; max: number }> = {};

    const rawAnswersMap = new Map<string, any>();
    if (Array.isArray(answers)) {
      answers.forEach(a => rawAnswersMap.set(a.questionId?.toString(), a.answer));
    }

    assessment.questions.forEach(q => {
      const qIdStr = q._id?.toString() || '';
      const userAns = rawAnswersMap.get(qIdStr);
      const points = q.points ?? 1;
      maxScore += assessment.settings.isGraded ? points : 0;

      let score = 0;
      if (assessment.settings.isGraded) {
        if (q.type === 'mcq') {
          if (userAns !== undefined && userAns !== null && String(userAns) === String(q.correctAnswer)) {
            score = points;
          }
        } else if (q.type === 'boolean') {
          if (userAns !== undefined && userAns !== null && Boolean(userAns) === Boolean(q.correctAnswer)) {
            score = points;
          }
        } else if (q.type === 'rating') {
          // Rating questions in graded tests are neutral or 0 default
          score = 0;
        } else if (q.type === 'text') {
          // Free text requires manual evaluation
          score = 0;
          if (points > 0) {
            hasPendingTextQuestions = true;
          }
        }
      }

      totalScore += score;

      if (q.competencyId) {
        const cKey = q.competencyId.toString();
        if (!competencyScoreAccumulator[cKey]) {
          competencyScoreAccumulator[cKey] = { scored: 0, max: 0 };
        }
        competencyScoreAccumulator[cKey].scored += score;
        competencyScoreAccumulator[cKey].max += points;
      }

      processedAnswers.push({
        questionId: q._id,
        answer: userAns,
        score,
      });
    });

    const status = (assessment.settings.isGraded && hasPendingTextQuestions) ? 'submitted' : 'reviewed';

    const responseDoc = await AssessmentResponse.create({
      assessmentId: new mongoose.Types.ObjectId(String(id)),
      facultyId: userId as any,
      attemptNumber,
      answers: processedAnswers,
      totalScore,
      maxScore,
      status,
      startedAt: startedAt ? new Date(startedAt) : now,
      submittedAt: now,
      timeTakenSeconds,
    });

    // Competency linkage: Safe weighted benchmark update
    if (assessment.settings.isGraded) {
      for (const [compId, compStats] of Object.entries(competencyScoreAccumulator)) {
        if (compStats.max > 0) {
          const compScorePct = Math.round((compStats.scored / compStats.max) * 100);
          try {
            const compRecord = await CompetencyRecord.findOne({ userId, skillArea: compId });
            if (compRecord) {
              compRecord.assessments.push({
                source: 'self',
                score: compScorePct,
                date: now,
                notes: `Assessment: ${assessment.title} (Attempt #${attemptNumber})`,
              });
              await compRecord.save();
            }
          } catch (cErr) {
            console.error('Failed to log competency assessment:', cErr);
          }
        }
      }
    }

    await logAudit(
      userId,
      'create',
      'AssessmentResponse',
      responseDoc._id,
      `Submitted assessment "${assessment.title}" (Score: ${totalScore}/${maxScore})`
    );

    res.status(201).json({
      success: true,
      data: responseDoc,
      message: status === 'reviewed' ? 'Assessment graded successfully' : 'Response submitted for manual review',
    });
  } catch (error: any) {
    console.error('Error submitting assessment response:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to submit response' });
  }
};

// ── 10. Get Assessment Responses & Analytics ──────────────────────────────────
export const getAssessmentResponses = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const assessment = await Assessment.findById(id).populate('targetScope.targetIds', 'name code');

    if (!assessment) {
      res.status(404).json({ success: false, error: 'Assessment not found' });
      return;
    }

    const userRole = req.user?.role;
    const userId = req.user?._id;
    const userDept = req.user?.department ? req.user.department.toString() : null;

    // Permissions check
    if (userRole === 'faculty_member') {
      res.status(403).json({ success: false, error: 'Faculty members cannot view aggregate responses' });
      return;
    }
    if (userRole === 'hod') {
      const isCreator = assessment.createdBy.toString() === userId?.toString();
      const isTargetDept = assessment.targetScope.type === 'department' &&
        assessment.targetScope.targetIds?.some((d: any) => d._id?.toString() === userDept || d.toString() === userDept);
      if (!isCreator && !isTargetDept && assessment.targetScope.type !== 'all') {
        res.status(403).json({ success: false, error: 'HODs can only view responses for assessments in their department' });
        return;
      }
    }

    const responses = await AssessmentResponse.find({ assessmentId: id })
      .populate('facultyId', 'name email department role')
      .populate({ path: 'facultyId', populate: { path: 'department', select: 'name code' } })
      .sort({ createdAt: -1 });

    // Anonymity Protection at the read layer
    const isAnonymous = assessment.settings.isAnonymous;
    let serializedResponses: any[] = [];

    if (isAnonymous) {
      // De-identify faculty identity and shuffle response order
      serializedResponses = responses.map((r, index) => ({
        _id: r._id,
        assessmentId: r.assessmentId,
        faculty: {
          name: `Anonymous Respondent #${index + 1}`,
          email: 'masked@institutional.local',
          department: null,
          role: 'faculty_member',
        },
        attemptNumber: r.attemptNumber,
        answers: r.answers,
        totalScore: r.totalScore,
        maxScore: r.maxScore,
        status: r.status,
        timeTakenSeconds: r.timeTakenSeconds,
        reviewerNotes: r.reviewerNotes,
        submittedAt: r.submittedAt,
      }));
      // Randomize array to decouple ordering from submission sequence
      serializedResponses.sort(() => Math.random() - 0.5);
    } else {
      serializedResponses = responses.map(r => ({
        _id: r._id,
        assessmentId: r.assessmentId,
        faculty: r.facultyId,
        attemptNumber: r.attemptNumber,
        answers: r.answers,
        totalScore: r.totalScore,
        maxScore: r.maxScore,
        status: r.status,
        timeTakenSeconds: r.timeTakenSeconds,
        reviewerNotes: r.reviewerNotes,
        submittedAt: r.submittedAt,
      }));
    }

    // Compute Comprehensive Analytics
    const totalResponses = responses.length;
    let avgScore = 0;
    let avgScorePct = 0;
    const scoreBuckets = [
      { range: '0-20%', count: 0 },
      { range: '21-40%', count: 0 },
      { range: '41-60%', count: 0 },
      { range: '61-80%', count: 0 },
      { range: '81-100%', count: 0 },
    ];

    if (totalResponses > 0 && assessment.settings.isGraded) {
      const sumScores = responses.reduce((sum, r) => sum + r.totalScore, 0);
      avgScore = Number((sumScores / totalResponses).toFixed(1));
      const maxPossible = responses[0]?.maxScore || 1;
      avgScorePct = maxPossible > 0 ? Number(((avgScore / maxPossible) * 100).toFixed(1)) : 0;

      responses.forEach(r => {
        const pct = r.maxScore > 0 ? (r.totalScore / r.maxScore) * 100 : 0;
        if (pct <= 20) scoreBuckets[0].count++;
        else if (pct <= 40) scoreBuckets[1].count++;
        else if (pct <= 60) scoreBuckets[2].count++;
        else if (pct <= 80) scoreBuckets[3].count++;
        else scoreBuckets[4].count++;
      });
    }

    // Per-question analytics breakdown
    const questionStats = assessment.questions.map((q, idx) => {
      const qIdStr = q._id?.toString();
      const questionAnswers = responses.map(r => r.answers.find(a => a.questionId.toString() === qIdStr)).filter(Boolean);

      if (q.type === 'mcq' || q.type === 'boolean') {
        const correctCount = questionAnswers.filter(a => (a?.score || 0) > 0).length;
        const accuracyPct = totalResponses > 0 ? Math.round((correctCount / totalResponses) * 100) : 0;
        return {
          questionNumber: idx + 1,
          prompt: q.prompt,
          type: q.type,
          correctCount,
          incorrectCount: totalResponses - correctCount,
          accuracyPct,
        };
      } else if (q.type === 'rating') {
        const ratingSum = questionAnswers.reduce((sum, a) => sum + (Number(a?.answer) || 0), 0);
        const avgRating = questionAnswers.length > 0 ? Number((ratingSum / questionAnswers.length).toFixed(1)) : 0;
        const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        questionAnswers.forEach(a => {
          const val = Number(a?.answer);
          if (distribution[val] !== undefined) distribution[val]++;
        });
        return {
          questionNumber: idx + 1,
          prompt: q.prompt,
          type: q.type,
          averageRating: avgRating,
          distribution,
        };
      } else {
        const textCount = questionAnswers.filter(a => a?.answer && String(a.answer).trim().length > 0).length;
        return {
          questionNumber: idx + 1,
          prompt: q.prompt,
          type: q.type,
          submittedResponsesCount: textCount,
        };
      }
    });

    res.json({
      success: true,
      data: {
        assessment,
        responses: serializedResponses,
        analytics: {
          totalResponses,
          averageScore: avgScore,
          averageScorePct: avgScorePct,
          scoreDistribution: scoreBuckets,
          questionStats,
        },
      },
    });
  } catch (error: any) {
    console.error('Error fetching assessment responses:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to fetch responses' });
  }
};

// ── 11. Get Single Faculty Response Detail ─────────────────────────────────────
export const getFacultyResponse = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id, facultyId } = req.params;
    const assessment = await Assessment.findById(id);
    if (!assessment) {
      res.status(404).json({ success: false, error: 'Assessment not found' });
      return;
    }

    if (assessment.settings.isAnonymous && req.user?.role !== 'administrator') {
      res.status(403).json({ success: false, error: 'Individual response lookup is disabled for anonymous assessments' });
      return;
    }

    const response = await AssessmentResponse.findOne({
      assessmentId: new mongoose.Types.ObjectId(String(id)),
      facultyId: new mongoose.Types.ObjectId(String(facultyId)),
    })
      .populate('facultyId', 'name email department role')
      .sort({ attemptNumber: -1 });

    if (!response) {
      res.status(404).json({ success: false, error: 'Response not found' });
      return;
    }

    res.json({ success: true, data: response });
  } catch (error: any) {
    console.error('Error fetching faculty response:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to fetch faculty response' });
  }
};

// ── 12. Manual Grade Response (Text Questions / Overrides) ─────────────────────
export const gradeResponse = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id, facultyId } = req.params;
    const { questionScores, reviewerNotes } = req.body;

    const assessment = await Assessment.findById(id);
    if (!assessment) {
      res.status(404).json({ success: false, error: 'Assessment not found' });
      return;
    }

    const response = await AssessmentResponse.findOne({
      assessmentId: new mongoose.Types.ObjectId(String(id)),
      facultyId: new mongoose.Types.ObjectId(String(facultyId)),
    });

    if (!response) {
      res.status(404).json({ success: false, error: 'Response not found' });
      return;
    }

    // Apply manual scores and feedback per question
    if (Array.isArray(questionScores)) {
      questionScores.forEach(qs => {
        const targetAns = response.answers.find(a => a.questionId.toString() === qs.questionId?.toString());
        if (targetAns) {
          if (qs.score !== undefined) targetAns.score = Number(qs.score);
          if (qs.feedback !== undefined) targetAns.feedback = String(qs.feedback);
        }
      });
    }

    response.totalScore = response.answers.reduce((sum, a) => sum + (a.score || 0), 0);
    response.status = 'reviewed';
    response.reviewerNotes = reviewerNotes || response.reviewerNotes;
    response.reviewedBy = req.user?._id;
    response.reviewedAt = new Date();

    await response.save();

    // Notify faculty member that their assessment has been reviewed
    await Notification.create({
      userId: response.facultyId,
      type: 'system',
      title: 'Assessment Reviewed',
      message: `Your response for "${assessment.title}" has been reviewed. Final Score: ${response.totalScore}/${response.maxScore}`,
      relatedEntityType: 'Assessment',
      relatedEntityId: assessment._id,
      status: 'unread',
    });

    await logAudit(
      req.user?._id,
      'update',
      'AssessmentResponse',
      response._id,
      `Graded response for user ${response.facultyId} on "${assessment.title}" (Score: ${response.totalScore})`
    );

    res.json({ success: true, data: response, message: 'Response graded successfully' });
  } catch (error: any) {
    console.error('Error grading response:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to grade response' });
  }
};

// ── 13. Export Responses to CSV ────────────────────────────────────────────────
export const exportResponsesCsv = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const assessment = await Assessment.findById(id);

    if (!assessment) {
      res.status(404).json({ success: false, error: 'Assessment not found' });
      return;
    }

    const responses = await AssessmentResponse.find({ assessmentId: id })
      .populate('facultyId', 'name email department')
      .populate({ path: 'facultyId', populate: { path: 'department', select: 'name code' } })
      .sort({ createdAt: 1 });

    const isAnonymous = assessment.settings.isAnonymous;

    const headers = [
      'Attempt',
      'Respondent Name',
      'Email',
      'Department',
      'Submission Date',
      'Time Taken (s)',
      'Total Score',
      'Max Score',
      'Score %',
      'Status',
      ...assessment.questions.map((q, i) => `Q${i + 1}: ${q.prompt.replace(/,/g, ' ')}`),
    ];

    const rows = responses.map((r, idx) => {
      const faculty = r.facultyId as any;
      const name = isAnonymous ? `Anonymous Respondent #${idx + 1}` : (faculty?.name || 'N/A');
      const email = isAnonymous ? 'masked' : (faculty?.email || 'N/A');
      const dept = isAnonymous ? 'N/A' : (faculty?.department?.name || 'N/A');
      const pct = r.maxScore > 0 ? ((r.totalScore / r.maxScore) * 100).toFixed(1) : 'N/A';

      const questionAnswers = assessment.questions.map(q => {
        const ans = r.answers.find(a => a.questionId.toString() === q._id?.toString());
        const val = ans?.answer !== undefined ? String(ans.answer).replace(/,/g, ';').replace(/\n/g, ' ') : '';
        return `"${val}"`;
      });

      return [
        r.attemptNumber,
        `"${name}"`,
        `"${email}"`,
        `"${dept}"`,
        r.submittedAt ? new Date(r.submittedAt).toISOString() : 'N/A',
        r.timeTakenSeconds,
        r.totalScore,
        r.maxScore,
        pct,
        r.status,
        ...questionAnswers,
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');

    await logAudit(
      req.user?._id,
      'export',
      'Assessment',
      assessment._id,
      `Exported CSV results for assessment "${assessment.title}" (${responses.length} rows)`
    );

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="assessment_${id}_results.csv"`);
    res.status(200).send(csvContent);
  } catch (error: any) {
    console.error('Error exporting assessment CSV:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to export CSV' });
  }
};
