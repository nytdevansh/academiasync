import { Response } from 'express';
import Notification from '../models/Notification';
import { AuthRequest } from '../middlewares/auth';

export const getMyNotifications = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const notifications = await Notification.find({ userId: req.user?._id, status: { $ne: 'archived' } }).sort({ createdAt: -1 }).limit(50);
    const unreadCount = await Notification.countDocuments({ userId: req.user?._id, status: 'unread' });
    res.json({ success: true, data: notifications, unreadCount });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const markAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { status: 'read' });
    res.json({ success: true, data: { message: 'Notification marked as read' } });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const markAllRead = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await Notification.updateMany({ userId: req.user?._id, status: 'unread' }, { status: 'read' });
    res.json({ success: true, data: { message: 'All notifications marked as read' } });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const archiveNotification = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { status: 'archived' });
    res.json({ success: true, data: { message: 'Notification archived' } });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};
