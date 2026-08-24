/**
 * complianceAlerts.ts
 *
 * Two scheduled jobs:
 * 1. Daily at 07:00 — flip 'pending'/'enrolled' recommendations past their dueDate → 'overdue'
 *                    + escalation notification to the recommending HOD/Dean
 *                    + reminder to faculty at T-7 days and T-1 day
 * 2. Daily at 07:05 — re-assessment reminder to HOD when a linked enrollment is completed
 *                    but no post-assessment score has been recorded yet
 */

import TrainingRecommendation from '../models/TrainingRecommendation';
import TrainingEnrollment from '../models/TrainingEnrollment';
import Notification from '../models/Notification';
import User from '../models/User';

// ─── Job 1: Mark overdue & send escalation notifications ─────────────────────
export const runOverdueJob = async (): Promise<void> => {
  try {
    const now = new Date();

    // Flip pending/enrolled past dueDate → overdue
    const overdueResult = await TrainingRecommendation.updateMany(
      { status: { $in: ['pending', 'enrolled'] }, dueDate: { $lt: now } },
      { $set: { status: 'overdue' } }
    );

    if (overdueResult.modifiedCount > 0) {
      console.log(`⚠️  Compliance: marked ${overdueResult.modifiedCount} recommendations as overdue`);

      // Fetch newly overdue recs to send notifications
      const overdueRecs = await TrainingRecommendation.find({
        status: 'overdue',
        dueDate: { $lt: now, $gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) }, // only today's batch
      }).populate('facultyId', 'name').populate('recommendedBy', 'name');

      for (const rec of overdueRecs) {
        const faculty: any = rec.facultyId;
        const recommender: any = rec.recommendedBy;
        const daysOverdue = Math.floor((now.getTime() - rec.dueDate.getTime()) / (1000 * 60 * 60 * 24));

        // Notify faculty
        await Notification.create({
          userId: rec.facultyId,
          type: 'deadline',
          title: 'Overdue: Training Recommendation',
          message: `Your recommended training is ${daysOverdue} day(s) overdue. Please enrol and complete it as soon as possible.`,
          relatedEntityType: 'TrainingRecommendation',
          relatedEntityId: rec._id,
        });

        // Escalate to recommending HOD/Dean
        await Notification.create({
          userId: rec.recommendedBy,
          type: 'deadline',
          title: `Overdue Training: ${faculty?.name || 'Faculty'}`,
          message: `Training recommendation for ${faculty?.name || 'a faculty member'} is ${daysOverdue} day(s) overdue. Reason: "${rec.reason}".`,
          relatedEntityType: 'TrainingRecommendation',
          relatedEntityId: rec._id,
        });
      }
    }

    // ── Reminder at T-7 days (UTC window) ────────────────────────────────────
    const DAY_MS = 24 * 60 * 60 * 1000;
    const in7DaysStart = new Date(now.getTime() + 6.5 * DAY_MS);
    const in7DaysEnd = new Date(now.getTime() + 7.5 * DAY_MS);

    const upcomingIn7 = await TrainingRecommendation.find({
      status: { $in: ['pending', 'enrolled'] },
      dueDate: { $gte: in7DaysStart, $lte: in7DaysEnd },
    });
    for (const rec of upcomingIn7) {
      // Check if notification already sent today for this recommendation
      const existing = await Notification.findOne({
        userId: rec.facultyId,
        relatedEntityId: rec._id,
        title: 'Training Reminder: 7 Days Left',
        createdAt: { $gte: new Date(now.getTime() - DAY_MS) }
      });
      if (!existing) {
        await Notification.create({
          userId: rec.facultyId,
          type: 'deadline',
          title: 'Training Reminder: 7 Days Left',
          message: `A training recommended to you is due in ~7 days. Reason: "${rec.reason}". Please enrol now.`,
          dueDate: rec.dueDate,
          relatedEntityType: 'TrainingRecommendation',
          relatedEntityId: rec._id,
        });
      }
    }

    // ── Reminder at T-1 day (UTC window) ─────────────────────────────────────
    const in1DayStart = new Date(now.getTime() + 0.5 * DAY_MS);
    const in1DayEnd = new Date(now.getTime() + 1.5 * DAY_MS);

    const upcomingIn1 = await TrainingRecommendation.find({
      status: { $in: ['pending', 'enrolled'] },
      dueDate: { $gte: in1DayStart, $lte: in1DayEnd },
    });
    for (const rec of upcomingIn1) {
      const existing = await Notification.findOne({
        userId: rec.facultyId,
        relatedEntityId: rec._id,
        title: 'Urgent: Training Due Tomorrow',
        createdAt: { $gte: new Date(now.getTime() - DAY_MS) }
      });
      if (!existing) {
        await Notification.create({
          userId: rec.facultyId,
          type: 'deadline',
          title: 'Urgent: Training Due Tomorrow',
          message: `Training recommended to you is due TOMORROW. Please complete your enrolment immediately. Reason: "${rec.reason}".`,
          dueDate: rec.dueDate,
          relatedEntityType: 'TrainingRecommendation',
          relatedEntityId: rec._id,
        });
      }
    }

    console.log(`✅ Compliance cron complete: ${overdueResult.modifiedCount} flipped, ${upcomingIn7.length} T-7 reminders checked, ${upcomingIn1.length} T-1 reminders checked`);
  } catch (err: any) {
    console.error('❌ Compliance cron error:', err.message);
  }
};

// ─── Job 2: Re-assessment reminder to HOD after training completion ───────────
export const runReassessmentReminderJob = async (): Promise<void> => {
  try {
    // Recs in 'enrolled' status where the linked enrollment is 'completed'
    // but no post-assessment score has been entered (scoreAfterCompletion is null)
    const completedEnrollments = await TrainingEnrollment.find({ status: 'completed' }).select('_id userId');
    const enrollmentIds = completedEnrollments.map(e => e._id);

    const needsReassessment = await TrainingRecommendation.find({
      enrollmentId: { $in: enrollmentIds },
      status: 'enrolled',
      scoreAfterCompletion: { $exists: false },
    }).populate('facultyId', 'name').populate('recommendedBy', 'name');

    for (const rec of needsReassessment) {
      const faculty: any = rec.facultyId;
      await Notification.create({
        userId: rec.recommendedBy,
        type: 'training',
        title: `Re-Assess: ${faculty?.name || 'Faculty'} Completed Training`,
        message: `${faculty?.name || 'A faculty member'} has completed the recommended training. Please record a post-training competency assessment to track improvement.`,
        relatedEntityType: 'TrainingRecommendation',
        relatedEntityId: rec._id,
      });
    }

    if (needsReassessment.length > 0) {
      console.log(`📋 Re-assessment reminders sent for ${needsReassessment.length} completed recommendations`);
    }
  } catch (err: any) {
    console.error('❌ Re-assessment reminder cron error:', err.message);
  }
};

// ─── Scheduler bootstrapper ───────────────────────────────────────────────────
export const startComplianceJobs = async (): Promise<void> => {
  try {
    // Run initial sweep on server start
    runOverdueJob();
    runReassessmentReminderJob();

    // Built-in daily interval (runs every 24 hours)
    const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
    setInterval(() => {
      console.log('🕖 Running scheduled daily compliance overdue sweep...');
      runOverdueJob();
      runReassessmentReminderJob();
    }, TWENTY_FOUR_HOURS);

    console.log('✅ Compliance scheduler running (initial sweep + 24h recurring interval)');
  } catch (err: any) {
    console.warn('⚠️  Compliance scheduler initialization note:', err?.message);
  }
};
