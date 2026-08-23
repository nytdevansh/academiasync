import { Response } from 'express';
import AuditLog from '../models/AuditLog';
import { AuthRequest } from '../middlewares/auth';

export const getAuditLogs = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { userId, action, entityType, startDate, endDate, page = 1, limit = 30 } = req.query;
    const filter: any = {};
    if (userId) filter.userId = userId;
    if (action) filter.action = action;
    if (entityType) filter.entityType = entityType;
    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) filter.timestamp.$gte = new Date(startDate as string);
      if (endDate) filter.timestamp.$lte = new Date(endDate as string);
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [logs, total] = await Promise.all([
      AuditLog.find(filter).populate('userId', 'name email role').skip(skip).limit(Number(limit)).sort({ timestamp: -1 }),
      AuditLog.countDocuments(filter),
    ]);

    res.json({ success: true, data: logs, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};
