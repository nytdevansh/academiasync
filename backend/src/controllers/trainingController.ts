import { Response } from 'express';
import TrainingProgram from '../models/TrainingProgram';
import TrainingEnrollment from '../models/TrainingEnrollment';
import User from '../models/User';
import Notification from '../models/Notification';
import { AuthRequest } from '../middlewares/auth';
import { logAudit } from '../services/auditService';

// ── Programs ──────────────────────────────────────────

export const getPrograms = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { type, mode, page = 1, limit = 20 } = req.query;
    const filter: any = { isActive: true };
    if (type) filter.type = type;
    if (mode) filter.mode = mode;
    const skip = (Number(page) - 1) * Number(limit);
    const [programs, total] = await Promise.all([
      TrainingProgram.find(filter).populate('createdBy', 'name').populate('targetDepartments', 'name code').skip(skip).limit(Number(limit)).sort({ startDate: -1 }),
      TrainingProgram.countDocuments(filter),
    ]);
    res.json({ success: true, data: programs, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const getProgramById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const program = await TrainingProgram.findById(req.params.id).populate('createdBy', 'name').populate('targetDepartments', 'name code');
    if (!program) { res.status(404).json({ success: false, error: 'Program not found' }); return; }
    res.json({ success: true, data: program });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const createProgram = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const program = await TrainingProgram.create({ ...req.body, createdBy: req.user?._id });
    await logAudit(req.user?._id, 'create', 'TrainingProgram', program._id, `Created training: ${program.title}`, null, program, req.ip, req.headers['user-agent']);
    res.status(201).json({ success: true, data: program });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const updateProgram = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const prev = await TrainingProgram.findById(req.params.id);
    const program = await TrainingProgram.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!program) { res.status(404).json({ success: false, error: 'Program not found' }); return; }
    await logAudit(req.user?._id, 'update', 'TrainingProgram', req.params.id, 'Updated training program', prev, program, req.ip, req.headers['user-agent']);
    res.json({ success: true, data: program });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const deleteProgram = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await TrainingProgram.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ success: true, data: { message: 'Program deactivated' } });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ── Enrollments ───────────────────────────────────────

// POST /api/v1/training/programs/:id/enroll — faculty self-nominates
export const enrollInProgram = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id: programId } = req.params;
    const program = await TrainingProgram.findById(programId);
    if (!program || !program.isActive) { res.status(404).json({ success: false, error: 'Program not found or inactive' }); return; }

    const existing = await TrainingEnrollment.findOne({ userId: req.user?._id, programId });
    if (existing) { res.status(400).json({ success: false, error: 'Already enrolled in this program' }); return; }

    const enrollment: any = await TrainingEnrollment.create({ userId: req.user?._id as any, programId: programId as any, nominatedBy: req.user?._id as any });

    // Notify HOD
    const hod: any = await User.findOne({ role: 'hod', department: req.user?.department });
    if (hod) {
      await Notification.create({ userId: hod._id, type: 'training', title: 'New Training Nomination', message: `${req.user?.name} has nominated for "${program.title}"`, relatedEntityType: 'TrainingEnrollment', relatedEntityId: enrollment._id });
    }

    await logAudit(req.user?._id, 'create', 'TrainingEnrollment', enrollment._id, `Enrolled in: ${program.title}`, null, enrollment, req.ip, req.headers['user-agent']);
    res.status(201).json({ success: true, data: enrollment });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// GET /api/v1/training/enrollments/mine
export const getMyEnrollments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const enrollments = await TrainingEnrollment.find({ userId: req.user?._id })
      .populate('programId', 'title type mode startDate endDate organizer')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: enrollments });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// GET /api/v1/training/enrollments/pending-approval — HOD sees own dept
export const getPendingApprovals = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const deptUsers = await User.find({ department: req.user?.department }).select('_id');
    const userIds = deptUsers.map(u => u._id);
    const enrollments = await TrainingEnrollment.find({ userId: { $in: userIds }, status: 'nominated' })
      .populate('userId', 'name email department')
      .populate('programId', 'title type startDate endDate')
      .sort({ nominationDate: -1 });
    res.json({ success: true, data: enrollments });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// GET /api/v1/training/enrollments/department/:deptId — HOD/Dean/Admin
export const getEnrollmentsByDepartment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { deptId } = req.params;
    if (req.user?.role === 'hod' && req.user?.department?.toString() !== deptId) {
      res.status(403).json({ success: false, error: 'Access denied' }); return;
    }
    const deptUsers = await User.find({ department: deptId }).select('_id');
    const userIds = deptUsers.map(u => u._id);
    const enrollments = await TrainingEnrollment.find({ userId: { $in: userIds } })
      .populate('userId', 'name email')
      .populate('programId', 'title type startDate')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: enrollments });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// PUT /api/v1/training/enrollments/:id/approve — HOD
export const approveEnrollment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const enrollment = await TrainingEnrollment.findById(req.params.id).populate('programId', 'title');
    if (!enrollment) { res.status(404).json({ success: false, error: 'Enrollment not found' }); return; }
    if (enrollment.status !== 'nominated') { res.status(400).json({ success: false, error: `Cannot approve enrollment in status: ${enrollment.status}` }); return; }

    const updated = await TrainingEnrollment.findByIdAndUpdate(req.params.id, { status: 'approved', approvedBy: req.user?._id, approvalDate: new Date() }, { new: true });

    // Notify faculty
    await Notification.create({ userId: enrollment.userId, type: 'training', title: 'Training Approved', message: `Your nomination for "${(enrollment.programId as any).title}" has been approved.`, relatedEntityType: 'TrainingEnrollment', relatedEntityId: enrollment._id });

    await logAudit(req.user?._id, 'update', 'TrainingEnrollment', req.params.id, 'Approved enrollment', { status: 'nominated' }, { status: 'approved' }, req.ip, req.headers['user-agent']);
    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// PUT /api/v1/training/enrollments/:id/reject — HOD
export const rejectEnrollment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { reason } = req.body;
    const enrollment = await TrainingEnrollment.findById(req.params.id).populate('programId', 'title');
    if (!enrollment) { res.status(404).json({ success: false, error: 'Enrollment not found' }); return; }

    const updated = await TrainingEnrollment.findByIdAndUpdate(req.params.id, { status: 'rejected', rejectionReason: reason }, { new: true });

    await Notification.create({ userId: enrollment.userId, type: 'training', title: 'Training Nomination Rejected', message: `Your nomination for "${(enrollment.programId as any).title}" was rejected. Reason: ${reason}`, relatedEntityType: 'TrainingEnrollment', relatedEntityId: enrollment._id });

    await logAudit(req.user?._id, 'update', 'TrainingEnrollment', req.params.id, `Rejected enrollment: ${reason}`, { status: 'nominated' }, { status: 'rejected' }, req.ip, req.headers['user-agent']);
    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// PUT /api/v1/training/enrollments/:id/mark-attended — HOD/Admin
export const markAttended = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const updated = await TrainingEnrollment.findByIdAndUpdate(req.params.id, { status: 'attended' }, { new: true });
    if (!updated) { res.status(404).json({ success: false, error: 'Enrollment not found' }); return; }
    await logAudit(req.user?._id, 'update', 'TrainingEnrollment', req.params.id, 'Marked as attended', { status: 'approved' }, { status: 'attended' }, req.ip, req.headers['user-agent']);
    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// PUT /api/v1/training/enrollments/:id/complete — faculty submits feedback
export const completeEnrollment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { feedback, certificateUrl } = req.body;
    const updated = await TrainingEnrollment.findByIdAndUpdate(
      req.params.id,
      { status: 'completed', feedback, certificateUrl, completionDate: new Date() },
      { new: true }
    );
    if (!updated) { res.status(404).json({ success: false, error: 'Enrollment not found' }); return; }
    await logAudit(req.user?._id, 'update', 'TrainingEnrollment', req.params.id, 'Marked as completed with feedback', { status: 'attended' }, { status: 'completed' }, req.ip, req.headers['user-agent']);
    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};
