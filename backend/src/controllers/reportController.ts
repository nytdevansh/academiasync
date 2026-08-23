import { Response } from 'express';
import User from '../models/User';
import TrainingEnrollment from '../models/TrainingEnrollment';
import CompetencyRecord from '../models/CompetencyRecord';
import Appraisal from '../models/Appraisal';
import FacultyProfile from '../models/FacultyProfile';
import Department from '../models/Department';
import { AuthRequest } from '../middlewares/auth';
import { logAudit } from '../services/auditService';

// GET /api/v1/reports/training-participation
export const trainingParticipation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { deptId, startDate, endDate } = req.query;
    const matchFilter: any = {};
    if (deptId) {
      const users = await User.find({ department: deptId as any }).select('_id');
      matchFilter.userId = { $in: users.map(u => u._id) };
    }
    if (req.user?.role === 'hod') {
      const deptUsers = await User.find({ department: req.user?.department as any }).select('_id');
      matchFilter.userId = { $in: deptUsers.map(u => u._id) };
    }

    const stats = await TrainingEnrollment.aggregate([
      { $match: matchFilter },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const byDept = await TrainingEnrollment.aggregate([
      { $match: matchFilter },
      { $lookup: { from: 'users', localField: 'userId', foreignField: '_id', as: 'user' } },
      { $unwind: '$user' },
      { $lookup: { from: 'departments', localField: 'user.department', foreignField: '_id', as: 'dept' } },
      { $unwind: { path: '$dept', preserveNullAndEmptyArrays: true } },
      { $group: { _id: { dept: '$dept.name', status: '$status' }, count: { $sum: 1 } } },
    ]);

    await logAudit(req.user?._id, 'export', 'Report', null, 'Exported training participation report', null, null, req.ip, req.headers['user-agent']);
    res.json({ success: true, data: { statusBreakdown: stats, byDepartment: byDept } });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// GET /api/v1/reports/competency-summary
export const competencySummary = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const matchFilter: any = {};
    if (req.user?.role === 'hod') {
      const deptUsers = await User.find({ department: req.user?.department }).select('_id');
      matchFilter.userId = { $in: deptUsers.map(u => u._id) };
    }

    const summary = await CompetencyRecord.aggregate([
      { $match: matchFilter },
      { $lookup: { from: 'skillareas', localField: 'skillArea', foreignField: '_id', as: 'area' } },
      { $unwind: '$area' },
      { $group: { _id: { area: '$area.name', level: '$currentLevel' }, count: { $sum: 1 } } },
    ]);

    res.json({ success: true, data: summary });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// GET /api/v1/reports/appraisal-scores
export const appraisalScores = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const matchFilter: any = { status: 'completed' };
    if (req.user?.role === 'hod') {
      const deptUsers = await User.find({ department: req.user?.department }).select('_id');
      matchFilter.userId = { $in: deptUsers.map(u => u._id) };
    }

    const scores = await Appraisal.find(matchFilter)
      .populate('userId', 'name department')
      .populate('cycleId', 'title academicYear')
      .select('userId cycleId finalScore status');

    const distribution = await Appraisal.aggregate([
      { $match: matchFilter },
      { $bucket: { groupBy: '$finalScore', boundaries: [0, 40, 60, 75, 90, 101], default: 'Other', output: { count: { $sum: 1 } } } },
    ]);

    res.json({ success: true, data: { scores, distribution } });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// GET /api/v1/reports/faculty-overview — Dean/Admin
export const facultyOverview = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const [totalFaculty, departments, profileStats, trainingStats] = await Promise.all([
      User.countDocuments({ role: { $in: ['faculty_member', 'hod'] }, status: 'active' }),
      Department.find({ isActive: true }).select('name code'),
      FacultyProfile.aggregate([{ $group: { _id: null, avgCompleteness: { $avg: '$profileCompleteness' } } }]),
      TrainingEnrollment.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    ]);

    const byDept = await User.aggregate([
      { $match: { role: { $in: ['faculty_member', 'hod'] } } },
      { $group: { _id: '$department', count: { $sum: 1 } } },
      { $lookup: { from: 'departments', localField: '_id', foreignField: '_id', as: 'dept' } },
      { $unwind: { path: '$dept', preserveNullAndEmptyArrays: true } },
      { $project: { deptName: '$dept.name', count: 1 } },
    ]);

    res.json({ success: true, data: { totalFaculty, departments: departments.length, avgProfileCompleteness: profileStats[0]?.avgCompleteness || 0, trainingStats, facultyByDepartment: byDept } });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// GET /api/v1/reports/dashboard-stats — all roles, scoped
export const dashboardStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const role = req.user?.role;
    const userId = req.user?._id;
    const deptId = req.user?.department;

    if (role === 'faculty_member') {
      const [profile, enrollments, appraisals, notifications] = await Promise.all([
        FacultyProfile.findOne({ userId }),
        TrainingEnrollment.find({ userId }),
        Appraisal.find({ userId, status: 'completed' }).sort({ createdAt: -1 }).limit(1),
        (await import('../models/Notification')).default.countDocuments({ userId, status: 'unread' }),
      ]);
      res.json({ success: true, data: { profileCompleteness: profile?.profileCompleteness || 0, totalTrainings: enrollments.length, activeTrainings: enrollments.filter(e => ['nominated', 'approved'].includes(e.status)).length, completedTrainings: enrollments.filter(e => e.status === 'completed').length, latestAppraisalScore: appraisals[0]?.finalScore || null, unreadNotifications: notifications } });
    } else if (role === 'hod') {
      const deptUsers = await User.find({ department: deptId }).select('_id');
      const userIds = deptUsers.map(u => u._id);
      const [totalFaculty, pendingApprovals, trainings] = await Promise.all([
        deptUsers.length,
        TrainingEnrollment.countDocuments({ userId: { $in: userIds }, status: 'nominated' }),
        TrainingEnrollment.find({ userId: { $in: userIds } }),
      ]);
      const completedTrainings = trainings.filter(t => t.status === 'completed').length;
      const coverage = totalFaculty > 0 ? Math.round((completedTrainings / totalFaculty) * 100) : 0;
      res.json({ success: true, data: { totalFaculty, pendingApprovals, trainingCoverage: coverage, totalEnrollments: trainings.length } });
    } else if (role === 'dean' || role === 'administrator') {
      const [totalUsers, totalDepts, pendingApprovals, auditToday] = await Promise.all([
        User.countDocuments({ status: 'active' }),
        Department.countDocuments({ isActive: true }),
        TrainingEnrollment.countDocuments({ status: 'nominated' }),
        (await import('../models/AuditLog')).default.countDocuments({ timestamp: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) } }),
      ]);
      res.json({ success: true, data: { totalUsers, totalDepartments: totalDepts, pendingApprovals, auditEventsToday: auditToday } });
    } else {
      res.json({ success: true, data: {} });
    }
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};
