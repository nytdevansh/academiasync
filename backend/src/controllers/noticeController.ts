import { Request, Response } from 'express';
import Notice from '../models/Notice';
import { AuthRequest } from '../middlewares/auth';

// GET /api/v1/notices/public — NO auth — returns active notices sorted newest first
export const getPublicNotices = async (_req: Request, res: Response): Promise<void> => {
  try {
    const notices = await Notice.find({ isActive: true })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json({ success: true, data: notices });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};



// GET /api/v1/notices — protected admin/hod/dean/hr — returns all notices
export const getAllNotices = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const notices = await Notice.find().sort({ createdAt: -1 });
    res.json({ success: true, data: notices });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// POST /api/v1/notices — admin/dean only — creates a notice
export const createNotice = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const notice = await Notice.create(req.body);
    res.status(201).json({ success: true, data: notice });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// PUT /api/v1/notices/:id — admin/dean only — updates a notice
export const updateNotice = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const notice = await Notice.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!notice) {
      res.status(404).json({ success: false, error: 'Notice not found' });
      return;
    }
    res.json({ success: true, data: notice });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// DELETE /api/v1/notices/:id — admin only — soft delete (sets isActive: false)
export const deleteNotice = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const notice = await Notice.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    if (!notice) {
      res.status(404).json({ success: false, error: 'Notice not found' });
      return;
    }
    res.json({ success: true, data: { message: 'Notice deactivated successfully' } });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};
