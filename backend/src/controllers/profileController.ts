import { Response } from 'express';
import FacultyProfile from '../models/FacultyProfile';
import User from '../models/User';
import { AuthRequest } from '../middlewares/auth';
import { logAudit } from '../services/auditService';
import mongoose from 'mongoose';

// Compute profile completeness %
const computeCompleteness = (p: any): number => {
  let score = 0;
  if (p.bio) score += 10;
  if (p.profilePhotoUrl) score += 10;
  if (p.qualifications?.length) score += 20;
  if (p.experience?.length) score += 20;
  if (p.certifications?.length) score += 10;
  if (p.accomplishments?.length) score += 10;
  if (p.subjectsTaught?.length) score += 10;
  if (p.researchAreas?.length) score += 10;
  return score;
};

// GET /api/v1/profiles/me
export const getMyProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    let profile = await FacultyProfile.findOne({ userId: req.user?._id })
      .populate('userId', 'name email role department status')
      .populate('subjectsTaught', 'name code credits');

    if (!profile) {
      profile = await FacultyProfile.create({ userId: req.user?._id });
    }
    res.json({ success: true, data: profile });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// PUT /api/v1/profiles/me
export const updateMyProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const prev = await FacultyProfile.findOne({ userId: req.user?._id });
    const updateData = { ...req.body };

    // Compute completeness
    const merged = { ...prev?.toObject(), ...updateData };
    updateData.profileCompleteness = computeCompleteness(merged);

    const profile = await FacultyProfile.findOneAndUpdate(
      { userId: req.user?._id },
      updateData,
      { new: true, upsert: true }
    ).populate('subjectsTaught', 'name code credits');

    await logAudit(req.user?._id, 'update', 'FacultyProfile', profile?._id, 'Updated own profile', prev?.toObject(), profile?.toObject(), req.ip, req.headers['user-agent']);
    res.json({ success: true, data: profile });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// GET /api/v1/profiles/:userId — HOD (own dept), Dean/Admin (all)
export const getProfileByUserId = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const targetUser = await User.findById(req.params.userId);
    if (!targetUser) { res.status(404).json({ success: false, error: 'User not found' }); return; }

    if (req.user?.role === 'hod') {
      const hodDept = req.user?.department?.toString();
      const targetDept = targetUser.department?.toString();
      if (hodDept !== targetDept) {
        res.status(403).json({ success: false, error: 'Access denied to this department' }); return;
      }
    }

    const profile = await FacultyProfile.findOne({ userId: req.params.userId })
      .populate('userId', 'name email role department status')
      .populate('subjectsTaught', 'name code credits');

    res.json({ success: true, data: profile });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// GET /api/v1/profiles/department/:deptId
export const getProfilesByDepartment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { deptId } = req.params;
    if (req.user?.role === 'hod' && req.user?.department?.toString() !== deptId) {
      res.status(403).json({ success: false, error: 'Access denied' }); return;
    }
    const users = await User.find({ department: deptId }).select('_id');
    const userIds = users.map(u => u._id);
    const profiles = await FacultyProfile.find({ userId: { $in: userIds } })
      .populate('userId', 'name email role status')
      .populate('subjectsTaught', 'name code');
    res.json({ success: true, data: profiles });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};
