import { Response } from 'express';
import CompetencyRecord from '../models/CompetencyRecord';
import SkillArea from '../models/SkillArea';
import User from '../models/User';
import { AuthRequest } from '../middlewares/auth';
import { logAudit } from '../services/auditService';

// GET /api/v1/competency/skill-areas
export const getSkillAreas = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const areas = await SkillArea.find({ isActive: true }).sort({ order: 1 });
    res.json({ success: true, data: areas });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// CRUD Skill Areas — Admin
export const createSkillArea = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const area = await SkillArea.create(req.body);
    await logAudit(req.user?._id, 'create', 'SkillArea', area._id, `Created skill area: ${area.name}`, null, area, req.ip, req.headers['user-agent']);
    res.status(201).json({ success: true, data: area });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const updateSkillArea = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const area = await SkillArea.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, data: area });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// GET /api/v1/competency/me
export const getMyCompetency = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const records = await CompetencyRecord.find({ userId: req.user?._id }).populate('skillArea', 'name category');
    res.json({ success: true, data: records });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// PUT /api/v1/competency/me — faculty updates their own
export const updateMyCompetency = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { skillAreaId, currentLevel, targetLevel, notes } = req.body;
    const prev = await CompetencyRecord.findOne({ userId: req.user?._id, skillArea: skillAreaId });
    const record = await CompetencyRecord.findOneAndUpdate(
      { userId: req.user?._id, skillArea: skillAreaId },
      { currentLevel, targetLevel, notes, lastAssessedDate: new Date() },
      { new: true, upsert: true }
    ).populate('skillArea', 'name category');
    await logAudit(req.user?._id, 'update', 'CompetencyRecord', record?._id, 'Updated competency', prev, record, req.ip, req.headers['user-agent']);
    res.json({ success: true, data: record });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// GET /api/v1/competency/department/:deptId — HOD/Dean/Admin
export const getDepartmentCompetency = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { deptId } = req.params;
    if (req.user?.role === 'hod' && req.user?.department?.toString() !== deptId) {
      res.status(403).json({ success: false, error: 'Access denied' }); return;
    }
    const users = await User.find({ department: deptId }).select('_id name');
    const userIds = users.map(u => u._id);
    const records = await CompetencyRecord.find({ userId: { $in: userIds } })
      .populate('userId', 'name email')
      .populate('skillArea', 'name category');
    res.json({ success: true, data: records });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// GET /api/v1/competency/gap-analysis/:deptId
export const getGapAnalysis = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { deptId } = req.params;
    if (req.user?.role === 'hod' && req.user?.department?.toString() !== deptId) {
      res.status(403).json({ success: false, error: 'Access denied' }); return;
    }
    const levelOrder = ['beginner', 'developing', 'proficient', 'advanced', 'expert'];
    const users = await User.find({ department: deptId, role: { $in: ['faculty_member', 'hod'] } }).select('_id name');
    const userIds = users.map(u => u._id);
    const records = await CompetencyRecord.find({ userId: { $in: userIds } })
      .populate('userId', 'name')
      .populate('skillArea', 'name category');

    // Summarize gaps
    const analysis = records.map(r => {
      const currIdx = levelOrder.indexOf(r.currentLevel);
      const tgtIdx = levelOrder.indexOf(r.targetLevel);
      return { ...r.toObject(), gap: tgtIdx - currIdx, hasGap: tgtIdx > currIdx };
    });
    res.json({ success: true, data: analysis });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// PUT /api/v1/competency/:id/assess — HOD assesses a faculty member
export const assessCompetency = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { currentLevel, targetLevel, gapsIdentified, notes } = req.body;
    const prev = await CompetencyRecord.findById(req.params.id);
    const record = await CompetencyRecord.findByIdAndUpdate(
      req.params.id,
      { currentLevel, targetLevel, gapsIdentified, notes, assessedBy: req.user?._id, lastAssessedDate: new Date() },
      { new: true }
    );
    await logAudit(req.user?._id, 'update', 'CompetencyRecord', req.params.id, 'HOD assessed competency', prev, record, req.ip, req.headers['user-agent']);
    res.json({ success: true, data: record });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};
