import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import TrainingSession, { ITrainingSession } from '../models/TrainingSession';
import TrainingProgram from '../models/TrainingProgram';
import TrainingEnrollment from '../models/TrainingEnrollment';
import AttendanceRecord from '../models/AttendanceRecord';
import { notify } from '../services/notificationService';
import { logAudit } from '../services/auditService';

// ── GET /api/v1/training/programs/:id/sessions ──────────────────────────────
export const getProgramSessions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const programId = (Array.isArray(req.params.id) ? req.params.id[0] : req.params.id) as string;
    const sessions = await TrainingSession.find({ programId })
      .sort({ scheduledDate: 1 })
      .populate('organiserId', 'name email role department')
      .lean();

    const data = sessions.map((s) => ({
      ...s,
      totalAttendees: s.attendees?.length || 0,
      presentCount: s.attendees?.filter((a) => a.present).length || 0,
    }));

    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ── GET /api/v1/training/sessions/:sessionId ────────────────────────────────
export const getSessionById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const sessionId = (Array.isArray(req.params.sessionId) ? req.params.sessionId[0] : req.params.sessionId) as string;
    const session = await TrainingSession.findById(sessionId)
      .populate('programId', 'title type organizer mode startDate endDate')
      .populate('organiserId', 'name email role department')
      .populate('attendees.userId', 'name email role department')
      .populate('attendanceMarkedBy', 'name email');

    if (!session) {
      res.status(404).json({ success: false, error: 'Training session not found' });
      return;
    }

    res.json({ success: true, data: session });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ── POST /api/v1/training/programs/:id/sessions ─────────────────────────────
// Admin / HOD / Dean creates a scheduled session and pre-populates attendee roster
export const createSession = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const programId = (Array.isArray(req.params.id) ? req.params.id[0] : req.params.id) as string;
    const { title, description, scheduledDate, startTime, endTime, venueOrLink } = req.body;

    if (!title || !scheduledDate) {
      res.status(400).json({ success: false, error: 'Session title and scheduledDate are required' });
      return;
    }

    const program = await TrainingProgram.findById(programId);
    if (!program) {
      res.status(404).json({ success: false, error: 'Training program not found' });
      return;
    }

    // Flag program as having scheduled sessions
    if (!program.hasScheduledSessions) {
      program.hasScheduledSessions = true;
      await program.save();
    }

    // Pre-populate attendee roster from all approved/nominated enrollees
    const enrollments = await TrainingEnrollment.find({
      programId,
      status: { $in: ['nominated', 'approved', 'attended', 'completed'] },
    }).select('userId _id');

    const attendees = enrollments.map((en) => ({
      userId: en.userId,
      enrollmentId: en._id,
      present: false,
    }));

    const session: any = await TrainingSession.create({
      programId: program._id,
      title,
      description,
      scheduledDate: new Date(scheduledDate),
      startTime,
      endTime,
      venueOrLink,
      status: 'scheduled',
      attendees,
    });

    await logAudit(
      req.user?._id,
      'create',
      'TrainingSession',
      session._id,
      `Scheduled session "${title}" for program "${program.title}" with ${attendees.length} initial enrollees`,
      null,
      session,
      req.ip,
      req.headers['user-agent']
    );

    res.status(201).json({ success: true, data: session });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ── POST /api/v1/training/sessions/:sessionId/assign-organiser ──────────────
// Atomic self-assignment by any faculty member, HOD, or Dean
export const assignOrganiser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { sessionId } = req.params;
    const userId = req.user?._id;

    // Atomic guard: only claims session if organiserId is currently null
    const session = await TrainingSession.findOneAndUpdate(
      { _id: sessionId, organiserId: null },
      {
        $set: {
          organiserId: userId,
          organiserAssignedAt: new Date(),
          status: 'organiser_assigned',
        },
      },
      { new: true }
    )
      .populate('programId', 'title')
      .populate('organiserId', 'name email');

    if (!session) {
      const existing = await TrainingSession.findById(sessionId).populate('organiserId', 'name');
      if (!existing) {
        res.status(404).json({ success: false, error: 'Session not found' });
        return;
      }
      res.status(409).json({
        success: false,
        error: `Session already has an assigned organiser (${(existing.organiserId as any)?.name || 'another faculty member'}).`,
      });
      return;
    }

    // Send dual-channel confirmation to the newly assigned organiser
    const programTitle = (session.programId as any)?.title || 'Faculty Training';
    await notify({
      userId: userId!,
      type: 'training',
      title: 'Session Organiser Role Assigned',
      message: `You are now the designated organiser for "${session.title}" (${programTitle}).`,
      channels: ['in_app', 'email'],
      emailData: {
        template: 'organiserAssigned',
        subject: `Organiser Assignment: ${session.title}`,
        variables: {
          sessionTitle: session.title,
          courseTitle: programTitle,
          scheduledDate: new Date(session.scheduledDate).toLocaleDateString(),
          venueOrLink: session.venueOrLink || 'See institutional schedule',
          sessionUrl: `${process.env.CLIENT_URL || 'http://localhost:5173'}/training/programs/${session.programId._id}/sessions`,
        },
      },
      relatedEntityType: 'TrainingSession',
      relatedEntityId: session._id as any,
    });

    await logAudit(
      userId,
      'update',
      'TrainingSession',
      session._id as any,
      `Self-assigned as organiser for session "${session.title}"`,
      null,
      null,
      req.ip,
      req.headers['user-agent']
    );

    res.json({
      success: true,
      message: 'Successfully assigned as session organiser',
      data: session,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ── POST /api/v1/training/sessions/:sessionId/unassign-organiser ────────────
// Allowed for current organiser (self-step-down) or Admin/HOD/Dean (override)
export const unassignOrganiser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { sessionId } = req.params;
    const session = await TrainingSession.findById(sessionId);

    if (!session) {
      res.status(404).json({ success: false, error: 'Session not found' });
      return;
    }

    const isCurrentOrganiser = session.organiserId && session.organiserId.toString() === req.user?._id.toString();
    const isPrivileged = ['administrator', 'hod', 'dean'].includes(req.user?.role || '');

    if (!isCurrentOrganiser && !isPrivileged) {
      res.status(403).json({ success: false, error: 'Only the assigned organiser or an Admin/HOD may release this role' });
      return;
    }

    const prevOrganiser = session.organiserId;
    session.organiserId = null;
    session.organiserAssignedAt = null;
    session.status = 'scheduled';
    await session.save();

    await logAudit(
      req.user?._id,
      'update',
      'TrainingSession',
      session._id as any,
      `Unassigned organiser (previous: ${prevOrganiser}) from session "${session.title}"`,
      null,
      null,
      req.ip,
      req.headers['user-agent']
    );

    res.json({
      success: true,
      message: 'Organiser role released; session is now open for assignment',
      data: session,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ── PUT /api/v1/training/sessions/:sessionId/attendance ─────────────────────
// Organiser or Admin/HOD marks and finalizes attendance
export const markSessionAttendance = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { sessionId } = req.params;
    const { attendees } = req.body as {
      attendees: Array<{ userId: string; present: boolean; notes?: string }>;
    };

    if (!Array.isArray(attendees)) {
      res.status(400).json({ success: false, error: 'attendees array is required' });
      return;
    }

    const session = await TrainingSession.findById(sessionId).populate('programId');
    if (!session) {
      res.status(404).json({ success: false, error: 'Session not found' });
      return;
    }

    const isCurrentOrganiser = session.organiserId && session.organiserId.toString() === req.user?._id.toString();
    const isPrivileged = ['administrator', 'hod', 'dean'].includes(req.user?.role || '');

    // RBAC: Must be assigned organiser or privileged
    if (!isCurrentOrganiser && !isPrivileged) {
      res.status(403).json({ success: false, error: 'Unauthorized: Only the assigned session organiser or an Admin/HOD can mark attendance' });
      return;
    }

    // Immutability: Once finalized, only Admin/HOD/Dean can reopen/edit
    if (session.status === 'attendance_marked' && !isPrivileged) {
      res.status(403).json({
        success: false,
        error: 'Attendance has been finalized and locked. Contact your Department Head or Administrator to request adjustments.',
      });
      return;
    }

    const now = new Date();
    const updatedAttendeesMap = new Map<string, { present: boolean; notes?: string }>();
    attendees.forEach((a) => updatedAttendeesMap.set(String(a.userId), { present: Boolean(a.present), notes: a.notes }));

    // Apply presence checkoff to roster
    session.attendees = session.attendees.map((att) => {
      const update = updatedAttendeesMap.get(String(att.userId));
      if (update !== undefined) {
        return {
          ...att,
          present: update.present,
          markedAt: now,
          notes: update.notes !== undefined ? update.notes : att.notes,
        };
      }
      return att;
    });

    session.attendanceMarkedAt = now;
    session.attendanceMarkedBy = req.user?._id;
    session.status = 'attendance_marked';
    await session.save();

    // ── Multi-Session Assessment Eligibility Check ──
    // Query all non-cancelled sessions for this programId
    const allSessions = await TrainingSession.find({
      programId: session.programId,
      status: { $ne: 'cancelled' },
    });

    const newlyAttendedUserIds: string[] = [];

    // For every marked attendee, check if they attended ALL non-cancelled sessions
    for (const attendee of attendees) {
      const uIdStr = String(attendee.userId);

      const attendedAllSessions =
        allSessions.length > 0 &&
        allSessions.every((s) => s.attendees.some((a) => a.userId.toString() === uIdStr && a.present));

      if (attendedAllSessions) {
        // Unlock assessment eligibility: flip enrollment status from approved -> attended
        const updatedEnrollment = await TrainingEnrollment.findOneAndUpdate(
          {
            programId: session.programId,
            userId: attendee.userId,
            status: { $in: ['nominated', 'approved'] },
          },
          { $set: { status: 'attended' } },
          { new: true }
        );

        if (updatedEnrollment) {
          newlyAttendedUserIds.push(uIdStr);
        }
      }
    }

    // ── Sync with AttendanceRecord for Backward Compatibility ──
    try {
      for (const attendee of attendees) {
        const enrollment = await TrainingEnrollment.findOne({
          programId: session.programId,
          userId: attendee.userId,
        });

        if (enrollment) {
          let record = await AttendanceRecord.findOne({ enrollmentId: enrollment._id });
          if (!record) {
            record = new AttendanceRecord({
              programId: session.programId,
              enrollmentId: enrollment._id,
              userId: attendee.userId,
              sessions: [],
              attendancePercentage: 0,
              isSatisfied: false,
            });
          }

          const existingSessionIdx = record.sessions.findIndex(
            (s) => s.sessionTitle === session.title || s.sessionDate.toISOString().slice(0, 10) === session.scheduledDate.toISOString().slice(0, 10)
          );

          const sessionEntry = {
            sessionDate: session.scheduledDate,
            sessionTitle: session.title,
            present: Boolean(attendee.present),
            markedBy: req.user?._id,
            markedAt: now,
            notes: attendee.notes,
          };

          if (existingSessionIdx >= 0) {
            record.sessions[existingSessionIdx] = sessionEntry;
          } else {
            record.sessions.push(sessionEntry);
          }

          const total = record.sessions.length;
          const presentCount = record.sessions.filter((s) => s.present).length;
          record.attendancePercentage = total > 0 ? Math.round((presentCount / total) * 100) : 0;
          record.isSatisfied = record.attendancePercentage >= 75;
          await record.save();
        }
      }
    } catch (syncErr: any) {
      console.warn('⚠️  [AttendanceRecord Sync Note]:', syncErr?.message);
    }

    // Send in-app notification to users whose eligibility unlocked
    for (const userId of newlyAttendedUserIds) {
      await notify({
        userId,
        type: 'training',
        title: 'Training Attendance Completed',
        message: `You have completed required attendance for "${(session.programId as any)?.title}". You may now take the certification assessment.`,
        channels: ['in_app'],
        relatedEntityType: 'TrainingSession',
        relatedEntityId: session._id as any,
      });
    }

    await logAudit(
      req.user?._id,
      'update',
      'TrainingSession',
      session._id as any,
      `Marked attendance for ${attendees.length} attendees on session "${session.title}" (Reopen override: ${isPrivileged})`,
      null,
      null,
      req.ip,
      req.headers['user-agent']
    );

    res.json({
      success: true,
      message: `Attendance finalized for ${attendees.length} attendees`,
      data: session,
      unlockedAttendeesCount: newlyAttendedUserIds.length,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};
