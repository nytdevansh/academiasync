import { Response } from 'express';
import Notification from '../models/Notification';
import User from '../models/User';
import { AuthRequest } from '../middlewares/auth';
import { sendEmail } from '../services/emailService';

export const getMyNotifications = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { includeArchived, status } = req.query;
    const filter: any = { userId: req.user?._id };
    if (status) {
      filter.status = status;
    } else if (includeArchived !== 'true') {
      filter.status = { $ne: 'archived' };
    }

    const notifications = await Notification.find(filter).sort({ createdAt: -1 }).limit(100);
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

export const deleteNotification = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const notif = await Notification.findOneAndDelete({ _id: req.params.id, userId: req.user?._id });
    if (!notif) {
      res.status(404).json({ success: false, error: 'Notification not found' });
      return;
    }
    res.json({ success: true, data: { message: 'Notification deleted' } });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const broadcastNotification = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, message, targetRole, departmentId, sendEmail: shouldSendEmail } = req.body;
    if (!title || !message) {
      res.status(400).json({ success: false, error: 'Title and message are required' });
      return;
    }

    const filter: any = { status: 'active' };
    if (targetRole && targetRole !== 'all') {
      filter.role = targetRole;
    }
    if (departmentId) {
      filter.department = departmentId;
    }

    const users = await User.find(filter).select('_id name email');
    const userIds = users.map(u => u._id);

    const notifs = userIds.map(uid => ({
      userId: uid,
      type: 'system',
      title,
      message,
      status: 'unread',
    }));

    if (notifs.length > 0) {
      await Notification.insertMany(notifs);
    }

    if (shouldSendEmail && users.length > 0) {
      for (const u of users) {
        if (u.email) {
          sendEmail({
            to: u.email,
            subject: `[AcademiaSync] ${title}`,
            html: `<div style="font-family: sans-serif; padding: 20px;"><h2>${title}</h2><p>${message}</p></div>`,
            text: message,
          }).catch(() => {});
        }
      }
    }

    res.status(201).json({
      success: true,
      count: userIds.length,
      message: `Notification broadcast to ${userIds.length} users.`
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

