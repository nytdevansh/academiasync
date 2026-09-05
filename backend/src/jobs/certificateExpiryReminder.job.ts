/**
 * certificateExpiryReminder.job.ts
 *
 * Scheduled background sweep checking active certificates approaching expiry (30, 7, 1 days).
 * Dispatches dual-channel notifications (in-app + email) and records sent thresholds on the Certificate model.
 */

import Certificate from '../models/Certificate';
import { notify } from '../services/notificationService';

const THRESHOLDS = [30, 7, 1];

export const runCertificateExpirySweep = async (): Promise<number> => {
  let remindersDispatched = 0;
  try {
    const now = Date.now();
    const thirtyDaysFromNow = new Date(now + 31 * 24 * 60 * 60 * 1000);

    // Find all valid certificates expiring within the next 31 days
    const certificates = await Certificate.find({
      status: 'valid',
      expiryDate: { $lte: thirtyDaysFromNow, $gt: new Date(now) },
    });

    for (const cert of certificates) {
      const msRemaining = cert.expiryDate.getTime() - now;
      const daysRemaining = Math.max(1, Math.ceil(msRemaining / (24 * 60 * 60 * 1000)));

      // Check which threshold applies
      for (const threshold of THRESHOLDS) {
        if (daysRemaining <= threshold && !cert.remindersSent.includes(threshold)) {
          // Send dual-channel expiry reminder
          await notify({
            userId: cert.teacherId,
            type: 'renewal',
            title: `Certificate Expiring in ${daysRemaining} Day${daysRemaining > 1 ? 's' : ''}`,
            message: `Your Certificate ${cert.certificateNumber} for "${cert.metadata?.courseTitle}" will expire on ${cert.expiryDate.toLocaleDateString()}. Please enroll in a refresher training cycle.`,
            channels: ['in_app', 'email'],
            emailData: {
              template: 'certificateExpiring',
              subject: `⏳ Renewal Reminder: Certificate Expiring in ${daysRemaining} Days`,
              variables: {
                courseTitle: cert.metadata?.courseTitle || 'Training Course',
                certificateNumber: cert.certificateNumber,
                daysRemaining,
                expiryDate: cert.expiryDate.toLocaleDateString(),
                renewalUrl: `${process.env.CLIENT_URL || 'http://localhost:5173'}/training/catalog`,
              },
            },
            relatedEntityType: 'Certificate',
            relatedEntityId: cert._id,
          });

          cert.remindersSent.push(threshold);
          await cert.save();
          remindersDispatched++;
          break; // Process one threshold per daily run for this cert
        }
      }
    }

    if (remindersDispatched > 0) {
      console.log(`⏳ [CertificateExpiryJob] Dispatched ${remindersDispatched} expiry reminders`);
    }
  } catch (err: any) {
    console.error('❌ [CertificateExpiryJob Error]:', err?.message || err);
  }
  return remindersDispatched;
};

const getMsUntilNext8AM = (): number => {
  const now = new Date();
  const next8AM = new Date(now);
  next8AM.setHours(8, 0, 0, 0);
  if (now.getTime() >= next8AM.getTime()) {
    next8AM.setDate(next8AM.getDate() + 1);
  }
  return next8AM.getTime() - now.getTime();
};

export const startCertificateExpiryScheduler = (): void => {
  try {
    const msUntil8AM = getMsUntilNext8AM();
    const hours = Math.floor(msUntil8AM / 3600000);
    const mins = Math.floor((msUntil8AM % 3600000) / 60000);

    // Schedule deterministic daily execution at strictly 08:00:00 AM server clock time
    const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
    setTimeout(() => {
      console.log('🕗 [08:00 AM] Triggering daily certificate expiry reminder sweep...');
      runCertificateExpirySweep();
      setInterval(() => {
        console.log('🕗 [08:00 AM] Triggering daily certificate expiry reminder sweep...');
        runCertificateExpirySweep();
      }, TWENTY_FOUR_HOURS);
    }, msUntil8AM);

    console.log(`✅ Certificate expiry scheduler initialized: Next daily sweep strictly scheduled for 08:00 AM (in ${hours}h ${mins}m)`);
  } catch (err: any) {
    console.warn('⚠️  [CertificateExpiryJob Startup Note]:', err?.message);
  }
};
