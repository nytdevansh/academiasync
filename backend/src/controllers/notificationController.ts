import { Response } from 'express';
import Notification from '../models/Notification';
import User from '../models/User';
import { AuthRequest } from '../middlewares/auth';
import { sendEmail, verifySmtpConnection } from '../services/emailService';

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

export const testEmailDispatch = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const targetEmail = req.body?.email || req.user?.email;
    if (!targetEmail) {
      res.status(400).json({ success: false, error: 'Recipient email address is required' });
      return;
    }

    const verification = await verifySmtpConnection();
    const result = await sendEmail({
      to: targetEmail,
      subject: '[AcademiaSync Test] Diagnostic Email Dispatch',
      html: `
        <div style="font-family: sans-serif; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; max-width: 560px;">
          <h2 style="color: #2563eb; margin-top: 0;">AcademiaSync Diagnostic Email</h2>
          <p style="color: #475569; font-size: 14px; line-height: 1.6;">
            This is an automated diagnostic test message dispatched by the AcademiaSync Faculty Enhancement System to verify that email transport credentials and delivery pipelines are operational.
          </p>
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 12px; border-radius: 8px; font-size: 13px; color: #1e293b;">
            <div><strong>Active Transport:</strong> ${verification.mode}</div>
            <div><strong>Recipient:</strong> ${targetEmail}</div>
            <div><strong>Timestamp:</strong> ${new Date().toISOString()}</div>
          </div>
          <p style="color: #94a3b8; font-size: 12px; margin-top: 16px;">
            If you received this email, outbound delivery is verified and functional.
          </p>
        </div>
      `,
      text: `AcademiaSync Diagnostic Email: Email transport is operational (${verification.mode}) to ${targetEmail} at ${new Date().toISOString()}`,
    });

    res.json({
      success: result.success,
      mode: verification.mode,
      isLiveDelivery: verification.mode !== 'mock_logger',
      messageId: result.messageId,
      previewUrl: result.previewUrl,
      error: result.error,
      warning: verification.mode === 'mock_logger'
        ? 'Email was logged to server console only (local fallback mode). To send live emails in production, ensure GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, and GMAIL_REFRESH_TOKEN are set in your environment.'
        : undefined,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

