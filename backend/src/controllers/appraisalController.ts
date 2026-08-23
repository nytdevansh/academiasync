import { Response } from 'express';
import Appraisal from '../models/Appraisal';
import AppraisalCycle from '../models/AppraisalCycle';
import User from '../models/User';
import Notification from '../models/Notification';
import { AuthRequest } from '../middlewares/auth';
import { logAudit } from '../services/auditService';

// ── Cycles ────────────────────────────────────────────

export const getCycles = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const cycles = await AppraisalCycle.find().populate('createdBy', 'name').sort({ createdAt: -1 });
    res.json({ success: true, data: cycles });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const getCycleById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const cycle = await AppraisalCycle.findById(req.params.id);
    if (!cycle) { res.status(404).json({ success: false, error: 'Cycle not found' }); return; }
    res.json({ success: true, data: cycle });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const createCycle = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const cycle = await AppraisalCycle.create({ ...req.body, createdBy: req.user?._id });
    await logAudit(req.user?._id, 'create', 'AppraisalCycle', cycle._id, `Created cycle: ${cycle.title}`, null, cycle, req.ip, req.headers['user-agent']);
    res.status(201).json({ success: true, data: cycle });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const updateCycle = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const cycle = await AppraisalCycle.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!cycle) { res.status(404).json({ success: false, error: 'Cycle not found' }); return; }
    res.json({ success: true, data: cycle });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ── Appraisals ────────────────────────────────────────

// GET /api/v1/appraisals/mine
export const getMyAppraisals = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const appraisals = await Appraisal.find({ userId: req.user?._id })
      .populate('cycleId', 'title academicYear startDate endDate criteria status')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: appraisals });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// POST /api/v1/appraisals/self-assessment
export const submitSelfAssessment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { cycleId, criteria } = req.body;
    const cycle = await AppraisalCycle.findById(cycleId);
    if (!cycle || cycle.status !== 'active') { res.status(400).json({ success: false, error: 'Appraisal cycle is not active' }); return; }

    const existing = await Appraisal.findOne({ userId: req.user?._id, cycleId });
    let appraisal;

    if (existing) {
      appraisal = await Appraisal.findByIdAndUpdate(existing._id, {
        'selfAssessment.criteria': criteria,
        'selfAssessment.submittedAt': new Date(),
        'selfAssessment.status': 'submitted',
        status: 'self_submitted',
      }, { new: true });
    } else {
      appraisal = await Appraisal.create({
        userId: req.user?._id,
        cycleId,
        selfAssessment: { criteria, submittedAt: new Date(), status: 'submitted' },
        status: 'self_submitted',
      });
    }

    // Notify HOD/Dean
    const reviewer = await User.findOne({ role: 'hod', department: req.user?.department });
    if (reviewer) {
      await Notification.create({ userId: reviewer._id, type: 'appraisal', title: 'Self-Assessment Submitted', message: `${req.user?.name} has submitted their self-assessment for ${cycle.title}`, relatedEntityType: 'Appraisal', relatedEntityId: appraisal?._id });
    }

    await logAudit(req.user?._id, 'update', 'Appraisal', appraisal?._id, 'Submitted self-assessment', null, null, req.ip, req.headers['user-agent']);
    res.json({ success: true, data: appraisal });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// PUT /api/v1/appraisals/:id/reviewer-assessment — HOD/Dean
export const submitReviewerAssessment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { criteria, overallRemarks } = req.body;
    const appraisal = await Appraisal.findById(req.params.id).populate('cycleId');
    if (!appraisal) { res.status(404).json({ success: false, error: 'Appraisal not found' }); return; }

    const cycle = appraisal.cycleId as any;
    // Compute weighted final score
    let total = 0, maxTotal = 0;
    criteria.forEach((c: any) => {
      const criterionDef = cycle.criteria?.find((cd: any) => cd._id.toString() === c.criterionId.toString());
      if (criterionDef) {
        total += c.score * (criterionDef.weight / 100);
        maxTotal += criterionDef.maxScore * (criterionDef.weight / 100);
      }
    });
    const finalScore = maxTotal > 0 ? Math.round((total / maxTotal) * 100) : 0;

    const updated = await Appraisal.findByIdAndUpdate(req.params.id, {
      reviewerAssessment: { reviewerId: req.user?._id, criteria, overallRemarks, submittedAt: new Date() },
      finalScore,
      status: 'completed',
    }, { new: true });

    // Notify faculty
    await Notification.create({ userId: appraisal.userId, type: 'appraisal', title: 'Appraisal Completed', message: `Your appraisal has been reviewed. Final score: ${finalScore}%`, relatedEntityType: 'Appraisal', relatedEntityId: appraisal._id });

    await logAudit(req.user?._id, 'update', 'Appraisal', req.params.id, `Reviewer assessment submitted. Score: ${finalScore}`, null, null, req.ip, req.headers['user-agent']);
    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// GET /api/v1/appraisals/department/:deptId — HOD/Dean/Admin
export const getDepartmentAppraisals = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { deptId } = req.params;
    if (req.user?.role === 'hod' && req.user?.department?.toString() !== deptId) {
      res.status(403).json({ success: false, error: 'Access denied' }); return;
    }
    const users = await User.find({ department: deptId }).select('_id');
    const userIds = users.map(u => u._id);
    const appraisals = await Appraisal.find({ userId: { $in: userIds } })
      .populate('userId', 'name email')
      .populate('cycleId', 'title academicYear status')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: appraisals });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};
