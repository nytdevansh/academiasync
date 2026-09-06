import { Response } from 'express';
import TrainingRecommendation from '../models/TrainingRecommendation';
import TrainingEnrollment from '../models/TrainingEnrollment';
import TrainingProgram from '../models/TrainingProgram';
import CompetencyRecord from '../models/CompetencyRecord';
import User from '../models/User';
import Notification from '../models/Notification';
import { AuthRequest } from '../middlewares/auth';
import { logAudit } from '../services/auditService';
import { notify } from '../services/notificationService';
import { runOverdueJob, runReassessmentReminderJob } from '../jobs/complianceAlerts';

// ─── HOD / Dean creates a recommendation (Single or Bulk) ────────────────────

// POST /api/v1/recommendations
export const createRecommendation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { facultyId, facultyIds, departmentId, programId, skillAreaId, reason, dueDate, notes, sendEmail: shouldSendEmail } = req.body;

    // Resolve target faculty list
    let targetIds: string[] = [];
    if (facultyIds && Array.isArray(facultyIds) && facultyIds.length > 0) {
      targetIds = facultyIds;
    } else if (departmentId) {
      const deptUsers = await User.find({ department: departmentId, role: { $in: ['faculty_member', 'hod'] }, status: 'active' }).select('_id');
      targetIds = deptUsers.map(u => u._id.toString());
    } else if (facultyId) {
      targetIds = [facultyId];
    } else {
      res.status(400).json({ success: false, error: 'Please specify facultyId, facultyIds, or departmentId' });
      return;
    }

    let programTitle = 'Training Program';
    if (programId) {
      const prog = await TrainingProgram.findById(programId).select('title');
      if (prog?.title) programTitle = prog.title;
    }

    const createdRecs = [];

    for (const fId of targetIds) {
      // Snapshot the current competency score for this skill (before delta)
      let scoreBeforeRecommendation: number | undefined;
      if (skillAreaId) {
        const cr = await CompetencyRecord.findOne({ userId: fId, skillArea: skillAreaId });
        scoreBeforeRecommendation = cr?.currentScore;
      }

      const rec = await TrainingRecommendation.create({
        facultyId: fId,
        programId,
        skillAreaId,
        recommendedBy: req.user?._id,
        reason,
        dueDate,
        notes,
        scoreBeforeRecommendation,
      });

      // Dispatch in-app notification and optional email via unified notify service
      await notify({
        userId: fId,
        type: 'training',
        title: 'New Training Recommended',
        message: `${req.user?.name} has recommended "${programTitle}" for you. Reason: ${reason}. Due: ${new Date(dueDate).toLocaleDateString()}.`,
        dueDate,
        relatedEntityType: 'TrainingRecommendation',
        relatedEntityId: rec._id,
        channels: shouldSendEmail ? ['in_app', 'email'] : ['in_app'],
        emailData: shouldSendEmail ? {
          template: 'nominationReceived',
          subject: `Training Recommended: ${programTitle}`,
          variables: {
            courseTitle: programTitle,
            facultyName: 'Faculty Colleague',
            programType: 'Recommended Training',
            startDate: new Date(dueDate).toLocaleDateString(),
            actionUrl: `${process.env.APP_URL || 'http://localhost:5173'}/recommendations`,
            year: new Date().getFullYear(),
          },
        } : undefined,
      });

      createdRecs.push(rec);
    }


    await logAudit(req.user?._id, 'create', 'TrainingRecommendation', createdRecs[0]?._id,
      `Recommended training for ${targetIds.length} faculty member(s)`, null, { count: targetIds.length, targetIds }, req.ip, req.headers['user-agent']);

    res.status(201).json({
      success: true,
      data: createdRecs.length === 1 ? createdRecs[0] : createdRecs,
      count: createdRecs.length
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ─── Faculty: my recommendations ──────────────────────────────────────────────

// GET /api/v1/recommendations/mine
export const getMyRecommendations = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const recs = await TrainingRecommendation.find({ facultyId: req.user?._id })
      .populate('programId', 'title type mode startDate endDate organizer effectiveness')
      .populate('skillAreaId', 'name category')
      .populate('recommendedBy', 'name role')
      .sort({ dueDate: 1 });
    res.json({ success: true, data: recs });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ─── HOD / Dean / Admin: compliance views ─────────────────────────────────────

// GET /api/v1/recommendations/department/:deptId — compliance table for HOD
export const getDepartmentRecommendations = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { deptId } = req.params;
    if (req.user?.role === 'hod' && req.user?.department?.toString() !== deptId) {
      res.status(403).json({ success: false, error: 'Access denied' }); return;
    }
    const deptUsers = await User.find({ department: deptId, role: { $in: ['faculty_member', 'hod'] } }).select('_id');
    const userIds = deptUsers.map(u => u._id);

    const recs = await TrainingRecommendation.find({ facultyId: { $in: userIds } })
      .populate('facultyId', 'name email')
      .populate('programId', 'title type effectiveness')
      .populate('skillAreaId', 'name category')
      .populate('recommendedBy', 'name')
      .sort({ dueDate: 1 });

    res.json({ success: true, data: recs });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// GET /api/v1/recommendations/compliance-stats/:deptId — summary numbers for stat cards
export const getComplianceStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { deptId } = req.params;
    const deptUsers = await User.find({ department: deptId, role: { $in: ['faculty_member', 'hod'] } }).select('_id');
    const userIds = deptUsers.map(u => u._id);

    const [total, pending, overdue, completed, ignored] = await Promise.all([
      TrainingRecommendation.countDocuments({ facultyId: { $in: userIds } }),
      TrainingRecommendation.countDocuments({ facultyId: { $in: userIds }, status: 'pending' }),
      TrainingRecommendation.countDocuments({ facultyId: { $in: userIds }, status: 'overdue' }),
      TrainingRecommendation.countDocuments({ facultyId: { $in: userIds }, status: 'completed' }),
      TrainingRecommendation.countDocuments({ facultyId: { $in: userIds }, status: 'ignored' }),
    ]);

    const activeTotal = total - ignored;
    const complianceRate = activeTotal > 0 ? Math.round((completed / activeTotal) * 100) : 100;

    res.json({ success: true, data: { total, pending, overdue, completed, ignored, complianceRate } });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ─── Faculty enrolls in a recommended program ─────────────────────────────────

// POST /api/v1/recommendations/:id/enroll
export const enrollFromRecommendation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const rec = await TrainingRecommendation.findById(req.params.id);
    if (!rec) { res.status(404).json({ success: false, error: 'Recommendation not found' }); return; }
    if (rec.facultyId.toString() !== req.user?._id?.toString()) {
      res.status(403).json({ success: false, error: 'Not your recommendation' }); return;
    }
    if (!rec.programId) {
      res.status(400).json({ success: false, error: 'This recommendation has no linked program — enroll manually from the catalog.' }); return;
    }

    // Create enrollment
    const enrollment = await TrainingEnrollment.create({
      userId: req.user?._id,
      programId: rec.programId,
      nominatedBy: req.user?._id,
    });

    // Link enrollment back to the recommendation
    await TrainingRecommendation.findByIdAndUpdate(rec._id, {
      status: 'enrolled',
      enrollmentId: enrollment._id,
    });

    res.status(201).json({ success: true, data: enrollment });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ─── Record post-completion score & compute delta (Idempotent) ────────────────

// PUT /api/v1/recommendations/:id/complete-assessment
// Called by HOD after re-assessing faculty post-training
export const recordPostAssessment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { scoreAfterCompletion, forceUpdate } = req.body;
    const rec = await TrainingRecommendation.findById(req.params.id);
    if (!rec) { res.status(404).json({ success: false, error: 'Recommendation not found' }); return; }

    // Race condition / idempotency guard
    if (rec.status === 'completed' && rec.scoreAfterCompletion != null && !forceUpdate) {
      res.status(409).json({
        success: false,
        error: 'Assessment already completed and locked for this recommendation. Pass forceUpdate: true to overwrite.'
      });
      return;
    }

    const delta = rec.scoreBeforeRecommendation != null
      ? scoreAfterCompletion - rec.scoreBeforeRecommendation
      : undefined;

    const updated = await TrainingRecommendation.findByIdAndUpdate(
      req.params.id,
      { scoreAfterCompletion, improvementDelta: delta, status: 'completed' },
      { new: true }
    );

    // Update program effectiveness aggregate
    if (rec.programId) {
      const allCompletedRecs = await TrainingRecommendation.find({
        programId: rec.programId,
        status: 'completed',
        improvementDelta: { $ne: null },
      });
      const totalEnrolled = await TrainingEnrollment.countDocuments({ programId: rec.programId });
      const completions = allCompletedRecs.length;
      const avgDelta = completions > 0
        ? allCompletedRecs.reduce((s, r) => s + (r.improvementDelta || 0), 0) / completions
        : 0;
      const completionRate = totalEnrolled > 0 ? Math.round((completions / totalEnrolled) * 100) : 0;

      const { default: TrainingProgram } = await import('../models/TrainingProgram');
      await TrainingProgram.findByIdAndUpdate(rec.programId, {
        'effectiveness.avgImprovementDelta': Math.round(avgDelta * 10) / 10,
        'effectiveness.totalCompletions': completions,
        'effectiveness.completionRate': completionRate,
        'effectiveness.lastUpdated': new Date(),
      });
    }

    // Notify faculty of verified skill delta
    if (delta !== undefined) {
      await Notification.create({
        userId: rec.facultyId,
        type: 'training',
        title: 'Post-Training Assessment Recorded',
        message: `Your post-training competency score has been recorded: ${scoreAfterCompletion}%. Measured growth: ${delta >= 0 ? '+' : ''}${delta.toFixed(1)} points.`,
        relatedEntityType: 'TrainingRecommendation',
        relatedEntityId: rec._id,
      });
    }

    await logAudit(req.user?._id, 'update', 'TrainingRecommendation', req.params.id,
      `Post-assessment recorded: delta ${delta}`, { scoreBeforeRecommendation: rec.scoreBeforeRecommendation }, { scoreAfterCompletion, improvementDelta: delta }, req.ip, req.headers['user-agent']);

    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ─── Faculty or HOD declines / ignores a recommendation with reason ───────────

// PUT /api/v1/recommendations/:id/ignore
export const ignoreRecommendation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { reason = 'Not applicable' } = req.body;
    const rec = await TrainingRecommendation.findById(req.params.id).populate('programId', 'title');
    if (!rec) { res.status(404).json({ success: false, error: 'Recommendation not found' }); return; }

    const isOwner = rec.facultyId.toString() === req.user?._id?.toString();
    const isPrivileged = ['hod', 'dean', 'administrator'].includes(req.user?.role || '');

    if (!isOwner && !isPrivileged) {
      res.status(403).json({ success: false, error: 'Unauthorized to decline this recommendation' }); return;
    }

    const updated = await TrainingRecommendation.findByIdAndUpdate(
      req.params.id,
      { status: 'ignored', declineReason: reason, declinedAt: new Date() },
      { new: true }
    );

    // Notify the recommending HOD if declined by faculty
    if (isOwner && rec.recommendedBy) {
      await Notification.create({
        userId: rec.recommendedBy,
        type: 'training',
        title: 'Training Recommendation Declined',
        message: `${req.user?.name} has declined the recommended training "${(rec.programId as any)?.title || 'Program'}". Reason: ${reason}`,
        relatedEntityType: 'TrainingRecommendation',
        relatedEntityId: rec._id,
      });
    }

    await logAudit(req.user?._id, 'update', 'TrainingRecommendation', req.params.id,
      `Declined training recommendation: ${reason}`, { status: rec.status }, { status: 'ignored', declineReason: reason }, req.ip, req.headers['user-agent']);

    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ─── Trigger Compliance Sweep (Webhook / Cron Endpoint) ───────────────────────

// POST /api/v1/recommendations/run-compliance-sweep
export const triggerComplianceSweep = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await runOverdueJob();
    await runReassessmentReminderJob();
    res.json({ success: true, message: 'Compliance sweep executed successfully' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};
