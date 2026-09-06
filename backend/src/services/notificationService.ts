import mongoose from 'mongoose';
import Notification, { INotification } from '../models/Notification';
import User from '../models/User';
import { sendEmail } from './emailService';
import { renderEmailTemplate } from './templateService';

export interface NotifyParams {
  userId: string | mongoose.Types.ObjectId;
  type: 'training' | 'appraisal' | 'deadline' | 'system' | 'renewal';
  title: string;
  message: string;
  channels?: ('in_app' | 'email')[];
  emailData?: {
    template: string;
    subject: string;
    variables?: Record<string, string | number>;
  };
  relatedEntityType?: string;
  relatedEntityId?: string | mongoose.Types.ObjectId;
  dueDate?: Date;
}

export interface NotifyResult {
  inAppSuccess: boolean;
  emailSuccess: boolean;
  notificationId?: string;
  previewUrl?: string;
  error?: string;
}

/**
 * Unified notification dispatcher for AcademiaSync.
 * Sends in-app and/or email notifications with independent fault tolerance.
 * Never throws to caller.
 */
export const notify = async ({
  userId,
  type,
  title,
  message,
  channels = ['in_app'],
  emailData,
  relatedEntityType,
  relatedEntityId,
  dueDate,
}: NotifyParams): Promise<NotifyResult> => {
  let inAppSuccess = false;
  let emailSuccess = false;
  let notificationId: string | undefined;
  let previewUrl: string | undefined;

  // 1. In-App Notification Channel
  if (channels.includes('in_app')) {
    try {
      const notif = await Notification.create({
        userId,
        type,
        title,
        message,
        dueDate,
        relatedEntityType,
        relatedEntityId,
      });
      inAppSuccess = true;
      notificationId = String(notif._id);
    } catch (err: any) {
      console.error('❌ [NotificationService] Failed to create in-app notification:', err?.message || err);
    }
  }

  // 2. Email Notification Channel
  if (channels.includes('email') && emailData) {
    try {
      const recipient = await User.findById(userId).select('name email');
      if (recipient?.email) {
        const mergedVariables: Record<string, string | number> = {
          recipientName: recipient.name || 'Faculty Member',
          title,
          message,
          ...emailData.variables,
        };

        const html = renderEmailTemplate(emailData.template, mergedVariables);
        const emailRes = await sendEmail({
          to: recipient.email,
          subject: emailData.subject,
          html,
          text: message,
        });

        emailSuccess = emailRes.success;
        previewUrl = emailRes.previewUrl;
        if (!emailRes.success) {
          console.error(`❌ [NotificationService] Email delivery failed for ${recipient.email}: ${emailRes.error}`);
          return {
            inAppSuccess,
            emailSuccess: false,
            notificationId,
            previewUrl,
            error: emailRes.error,
          };
        }
      } else {
        console.warn(`⚠️  [NotificationService] No email found for userId: ${userId}`);
      }
    } catch (err: any) {
      console.error('❌ [NotificationService] Failed to process email notification:', err?.message || err);
      return {
        inAppSuccess,
        emailSuccess: false,
        notificationId,
        previewUrl,
        error: err?.message,
      };
    }
  }

  return {
    inAppSuccess,
    emailSuccess,
    notificationId,
    previewUrl,
  };
};

