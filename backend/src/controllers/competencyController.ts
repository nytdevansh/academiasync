import { Response } from 'express';
import CompetencyRecord, { scoreTolevel } from '../models/CompetencyRecord';
import SkillArea from '../models/SkillArea';
import User from '../models/User';
import Notification from '../models/Notification';
import { AuthRequest } from '../middlewares/auth';
import { logAudit } from '../services/auditService';

// ─── Skill Areas ──────────────────────────────────────────────────────────────

export const getSkillAreas = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const areas = await SkillArea.find({ isActive: true }).sort({ order: 1 });
    res.json({ success: true, data: areas });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

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

// ─── My Competency (Faculty) ──────────────────────────────────────────────────

// GET /api/v1/competency/me
export const getMyCompetency = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const records = await CompetencyRecord.find({ userId: req.user?._id })
      .populate('skillArea', 'name category description');
    res.json({ success: true, data: records });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// PUT /api/v1/competency/me — faculty self-assessment (adds to assessments array)
export const updateMyCompetency = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { skillAreaId, currentLevel, targetLevel, notes, score, rubricScores } = req.body;

    const prev = await CompetencyRecord.findOne({ userId: req.user?._id, skillArea: skillAreaId });

    // Build the new assessment entry
    const newEntry = {
      source: 'self' as const,
      score: score ?? 0,
      date: new Date(),
      notes,
      assessedBy: req.user?._id,
      rubricScores: rubricScores || [],
    };

    // Compute updated score & trend
    const updatedScore = score ?? 0;
    const trend = prev?.currentScore
      ? updatedScore > prev.currentScore + 2 ? 'improving'
        : updatedScore < prev.currentScore - 2 ? 'declining'
        : 'flat'
      : 'flat';

    const record = await CompetencyRecord.findOneAndUpdate(
      { userId: req.user?._id, skillArea: skillAreaId },
      {
        $push: { assessments: newEntry },
        $set: {
          currentLevel: currentLevel || scoreTolevel(updatedScore),
          targetLevel,
          notes,
          currentScore: updatedScore,
          trend,
          lastAssessedDate: new Date(),
          assessedBy: req.user?._id,
        },
      },
      { new: true, upsert: true }
    ).populate('skillArea', 'name category');

    await logAudit(req.user?._id, 'update', 'CompetencyRecord', record?._id,
      'Self-assessment submitted', prev, record, req.ip, req.headers['user-agent']);

    res.json({ success: true, data: record });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ─── Department Competency ────────────────────────────────────────────────────

// GET /api/v1/competency/department/:deptId
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

// ─── HOD Assessment (multi-source) ───────────────────────────────────────────

// PUT /api/v1/competency/:id/assess — HOD submits their rating for a faculty member
export const assessCompetency = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { currentLevel, targetLevel, gapsIdentified, notes, score, rubricScores } = req.body;
    const prev = await CompetencyRecord.findById(req.params.id);

    const newEntry = {
      source: 'hod' as const,
      score: score ?? 0,
      date: new Date(),
      notes,
      assessedBy: req.user?._id,
      rubricScores: rubricScores || [],
    };

    // Recompute score: weighted average (hod 50%, self 50% of latest each)
    const latestSelf = prev?.assessments.filter(a => a.source === 'self').slice(-1)[0];
    const newScore = latestSelf
      ? Math.round((score * 0.5 + latestSelf.score * 0.5))
      : score ?? 0;

    const trend = prev?.currentScore
      ? newScore > prev.currentScore + 2 ? 'improving'
        : newScore < prev.currentScore - 2 ? 'declining'
        : 'flat'
      : 'flat';

    const record = await CompetencyRecord.findByIdAndUpdate(
      req.params.id,
      {
        $push: { assessments: newEntry },
        $set: {
          currentLevel: currentLevel || scoreTolevel(newScore),
          targetLevel,
          gapsIdentified,
          notes,
          assessedBy: req.user?._id,
          lastAssessedDate: new Date(),
          currentScore: newScore,
          trend,
        },
      },
      { new: true }
    );

    // Notify faculty of HOD assessment
    if (prev?.userId) {
      await Notification.create({
        userId: prev.userId,
        type: 'system',
        title: 'Competency Assessment Updated',
        message: `${req.user?.name} has assessed your competency. Current score: ${newScore}/100 (${scoreTolevel(newScore)}).`,
        relatedEntityType: 'CompetencyRecord',
        relatedEntityId: prev._id,
      });
    }

    await logAudit(req.user?._id, 'update', 'CompetencyRecord', req.params.id,
      `HOD assessed competency — score: ${newScore}`, prev, record, req.ip, req.headers['user-agent']);

    res.json({ success: true, data: record });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ─── Assessment History ───────────────────────────────────────────────────────

// GET /api/v1/competency/:id/history — full assessment timeline for a record
export const getAssessmentHistory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const record = await CompetencyRecord.findById(req.params.id)
      .populate('assessments.assessedBy', 'name role')
      .populate('skillArea', 'name category');
    if (!record) { res.status(404).json({ success: false, error: 'Record not found' }); return; }
    // Only allow: the faculty member themselves, HOD/Dean/Admin
    const isOwner = record.userId.toString() === req.user?._id?.toString();
    const isPrivileged = ['hod', 'dean', 'administrator'].includes(req.user?.role || '');
    if (!isOwner && !isPrivileged) {
      res.status(403).json({ success: false, error: 'Access denied' }); return;
    }
    res.json({ success: true, data: record });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};
