import { Response } from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User';
import FacultyProfile from '../models/FacultyProfile';
import Department from '../models/Department';
import RefreshToken from '../models/RefreshToken';
import { AuthRequest } from '../middlewares/auth';
import { logAudit } from '../services/auditService';

// GET /api/v1/users/public-directory — public campus directory
export const getPublicFacultyDirectory = async (_req: any, res: Response): Promise<void> => {
  try {
    const faculty = await User.find({ status: 'active', role: { $in: ['faculty_member', 'hod', 'dean', 'administrator'] } })
      .select('name email role department')
      .populate('department', 'name code')
      .sort({ name: 1 });
    res.json({ success: true, data: faculty });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// GET /api/v1/users — admin only
export const getAllUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { role, department, status, page = 1, limit = 20 } = req.query;
    const filter: any = {};
    if (role) filter.role = role;
    if (department) filter.department = department;
    if (status) filter.status = status;

    const skip = (Number(page) - 1) * Number(limit);
    const [users, total] = await Promise.all([
      User.find(filter).select('-passwordHash').populate('department', 'name code').skip(skip).limit(Number(limit)).sort({ createdAt: -1 }),
      User.countDocuments(filter),
    ]);

    res.json({ success: true, data: users, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// GET /api/v1/users/department/:deptId — hod/dean/admin
export const getUsersByDepartment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { deptId } = req.params;
    // HOD can only see their own department
    if (req.user?.role === 'hod' && req.user?.department?.toString() !== deptId) {
      res.status(403).json({ success: false, error: 'Access denied to this department' });
      return;
    }
    const users = await User.find({ department: deptId }).select('-passwordHash').populate('department', 'name code');
    res.json({ success: true, data: users });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// GET /api/v1/users/:id
export const getUserById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.params.id).select('-passwordHash').populate('department', 'name code');
    if (!user) { res.status(404).json({ success: false, error: 'User not found' }); return; }
    res.json({ success: true, data: user });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// POST /api/v1/users — admin creates user
export const createUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, email, password, role, department } = req.body;
    const exists = await User.findOne({ email });
    if (exists) { res.status(400).json({ success: false, error: 'Email already in use' }); return; }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const user = await User.create({ name, email, passwordHash, role, department });

    // Auto-create faculty profile for faculty_member role
    if (role === 'faculty_member' || role === 'hod') {
      await FacultyProfile.create({ userId: user._id });
    }

    await logAudit(req.user?._id, 'create', 'User', user._id, `Created user ${email}`, null, { name, email, role }, req.ip, req.headers['user-agent']);
    res.status(201).json({ success: true, data: { ...user.toObject(), passwordHash: undefined } });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// PUT /api/v1/users/:id — admin
export const updateUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const prev = await User.findById(req.params.id).select('-passwordHash');
    if (!prev) { res.status(404).json({ success: false, error: 'User not found' }); return; }

    const { name, role, department, status } = req.body;
    const updated = await User.findByIdAndUpdate(req.params.id, { name, role, department, status }, { new: true }).select('-passwordHash').populate('department', 'name code');

    // ── Sync Department.hodRef ─────────────────────────────────────────────
    // If this user was previously an HOD of a department, clear that department's hodRef
    if (prev.role === 'hod' && prev.department) {
      const prevDeptId = prev.department.toString();
      const newDeptId = department ? department.toString() : '';
      // Clear if they changed department OR are no longer HOD
      if (role !== 'hod' || prevDeptId !== newDeptId) {
        await Department.findByIdAndUpdate(prevDeptId, { $unset: { hodRef: '' } });
      }
    }
    // If they are now HOD of a department, set that department's hodRef
    if (role === 'hod' && department) {
      await Department.findByIdAndUpdate(department, { hodRef: req.params.id });
    }
    // ──────────────────────────────────────────────────────────────────────

    await logAudit(req.user?._id, 'update', 'User', req.params.id, `Updated user`, prev.toObject(), updated?.toObject(), req.ip, req.headers['user-agent']);
    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// DELETE /api/v1/users/:id — admin (soft delete = suspend)
export const deleteUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { status: 'suspended' }, { new: true });
    if (!user) { res.status(404).json({ success: false, error: 'User not found' }); return; }

    // Invalidate all active refresh token sessions for the suspended user
    await RefreshToken.updateMany({ userId: req.params.id }, { revoked: true });

    await logAudit(req.user?._id, 'delete', 'User', req.params.id, `Suspended user ${user.email} and terminated all active sessions`, null, null, req.ip, req.headers['user-agent']);
    res.json({ success: true, data: { message: 'User suspended and all active sessions terminated' } });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// PUT /api/v1/users/:id/reset-password — admin
export const resetPassword = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { newPassword } = req.body;
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);
    await User.findByIdAndUpdate(req.params.id, { passwordHash });

    // Invalidate all existing sessions upon password reset
    await RefreshToken.updateMany({ userId: req.params.id }, { revoked: true });

    await logAudit(req.user?._id, 'update', 'User', req.params.id, 'Password reset by admin and sessions invalidated', null, null, req.ip, req.headers['user-agent']);
    res.json({ success: true, data: { message: 'Password reset successfully and existing sessions revoked' } });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// POST /api/v1/users/:id/revoke-sessions — admin (force logout all sessions)
export const revokeUserSessions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) { res.status(404).json({ success: false, error: 'User not found' }); return; }

    const result = await RefreshToken.updateMany({ userId: req.params.id }, { revoked: true });
    await logAudit(req.user?._id, 'logout', 'User', req.params.id, `Admin terminated all active sessions for ${user.email}`, null, null, req.ip, req.headers['user-agent']);

    res.json({
      success: true,
      data: {
        message: `Terminated ${result.modifiedCount} active session(s) for ${user.name}`,
        revokedCount: result.modifiedCount,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};
