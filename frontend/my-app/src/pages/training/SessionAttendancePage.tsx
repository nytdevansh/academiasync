import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Calendar,
  Clock,
  MapPin,
  UserCheck,
  UserX,
  Users,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Lock,
  Unlock,
  ChevronLeft,
  Plus,
  Search,
  ExternalLink,
  Sparkles,
  HelpCircle,
  AlertTriangle,
  PlayCircle,
  Award,
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { SearchBar } from '../../components/ui/SearchBar';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { useAuth } from '../../context/AuthContext';
import {
  getProgramSessions,
  getSessionById,
  createSession,
  assignOrganiser,
  unassignOrganiser,
  markSessionAttendance,
} from '../../api/sessions';
import { getProgramById } from '../../api/training';
import type { TrainingSession, ISessionAttendee, TrainingProgram } from '../../types';

export const SessionAttendancePage: React.FC = () => {
  const { id: routeProgramId, sessionId: routeSessionId } = useParams<{
    id?: string;
    sessionId?: string;
  }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [program, setProgram] = useState<TrainingProgram | null>(null);
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [activeSession, setActiveSession] = useState<TrainingSession | null>(null);

  // Search & Filter within Active Session Roster
  const [searchQuery, setSearchQuery] = useState('');

  // Local Attendance State for Editing
  const [rosterDraft, setRosterDraft] = useState<
    Array<{ userId: string; name: string; email: string; department?: string; present: boolean; notes: string }>
  >([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccessMsg, setSubmitSuccessMsg] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modals
  const [showClaimModal, setShowClaimModal] = useState<TrainingSession | null>(null);
  const [showUnclaimModal, setShowUnclaimModal] = useState<TrainingSession | null>(null);
  const [showFinalizeModal, setShowFinalizeModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Create Session Form State
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newScheduledDate, setNewScheduledDate] = useState('');
  const [newStartTime, setNewStartTime] = useState('10:00 AM');
  const [newEndTime, setNewEndTime] = useState('01:00 PM');
  const [newVenueOrLink, setNewVenueOrLink] = useState('');
  const [creatingSession, setCreatingSession] = useState(false);

  const isPrivileged = ['administrator', 'hod', 'dean'].includes(user?.role || '');

  // Load Program & Sessions
  const loadData = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      let currentProgId = routeProgramId;

      if (routeSessionId && !currentProgId) {
        const sessionRes = await getSessionById(routeSessionId);
        if (sessionRes.success && sessionRes.data) {
          const loadedSession = sessionRes.data;
          setActiveSession(loadedSession);
          currentProgId = typeof loadedSession.programId === 'object'
            ? loadedSession.programId._id
            : loadedSession.programId;
        }
      }

      if (currentProgId) {
        const [progRes, sessionsRes] = await Promise.all([
          getProgramById(currentProgId).catch(() => ({ success: false, data: null })),
          getProgramSessions(currentProgId).catch(() => ({ success: false, data: [] })),
        ]);

        if (progRes.success && progRes.data) {
          setProgram(progRes.data);
        }

        if (sessionsRes.success && sessionsRes.data) {
          setSessions(sessionsRes.data);

          // If activeSession is not set, pick routeSessionId or the first session
          if (routeSessionId) {
            const found = sessionsRes.data.find((s) => s._id === routeSessionId);
            if (found) {
              selectSession(found);
            }
          } else if (sessionsRes.data.length > 0 && !activeSession) {
            selectSession(sessionsRes.data[0]);
          }
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load session details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [routeProgramId, routeSessionId]);

  // When switching or selecting a session, initialize local editable draft
  const selectSession = async (session: TrainingSession) => {
    // If attendee details are populated (object userId), use them; otherwise fetch complete by ID
    try {
      const fullRes = await getSessionById(session._id);
      const fullSession = fullRes.success && fullRes.data ? fullRes.data : session;
      setActiveSession(fullSession);

      const draft = (fullSession.attendees || []).map((att: any) => ({
        userId: typeof att.userId === 'object' ? att.userId._id : att.userId,
        name: typeof att.userId === 'object' ? att.userId.name : 'Enrolled Faculty Member',
        email: typeof att.userId === 'object' ? att.userId.email : '',
        department: typeof att.userId === 'object' ? att.userId.department?.name || '' : '',
        present: Boolean(att.present),
        notes: att.notes || '',
      }));
      setRosterDraft(draft);
      setSubmitSuccessMsg(null);
      setErrorMessage(null);
    } catch (err: any) {
      setActiveSession(session);
    }
  };

  // Permission Checks for Active Session
  const isOrganiser = useMemo(() => {
    if (!activeSession || !user) return false;
    const orgId = typeof activeSession.organiserId === 'object'
      ? (activeSession.organiserId as any)?._id
      : activeSession.organiserId;
    return orgId && String(orgId) === String(user._id);
  }, [activeSession, user]);

  const canEditAttendance = isOrganiser || isPrivileged;
  const isFinalized = activeSession?.status === 'attendance_marked';
  const isLockedForCurrentUser = isFinalized && !isPrivileged;

  // Organiser Assignment Handler
  const handleAssignOrganiser = async (sess: TrainingSession) => {
    try {
      setIsSubmitting(true);
      const res = await assignOrganiser(sess._id);
      if (res.success) {
        setShowClaimModal(null);
        await loadData();
        if (res.data) selectSession(res.data);
      }
    } catch (err: any) {
      setErrorMessage(err.response?.data?.error || err.message || 'Failed to assign organiser.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Organiser Unassignment Handler
  const handleUnassignOrganiser = async (sess: TrainingSession) => {
    try {
      setIsSubmitting(true);
      const res = await unassignOrganiser(sess._id);
      if (res.success) {
        setShowUnclaimModal(null);
        await loadData();
        if (res.data) selectSession(res.data);
      }
    } catch (err: any) {
      setErrorMessage(err.response?.data?.error || err.message || 'Failed to unassign organiser.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle Attendance
  const toggleAttendance = (userId: string) => {
    if (isLockedForCurrentUser) return;
    setRosterDraft((prev) =>
      prev.map((item) =>
        item.userId === userId ? { ...item, present: !item.present } : item
      )
    );
  };

  // Batch Marks
  const markAll = (present: boolean) => {
    if (isLockedForCurrentUser) return;
    setRosterDraft((prev) => prev.map((item) => ({ ...item, present })));
  };

  // Note changes
  const updateNote = (userId: string, notes: string) => {
    if (isLockedForCurrentUser) return;
    setRosterDraft((prev) =>
      prev.map((item) => (item.userId === userId ? { ...item, notes } : item))
    );
  };

  // Finalize & Save Attendance
  const handleSaveAttendance = async () => {
    if (!activeSession) return;
    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      const payload = rosterDraft.map((item) => ({
        userId: item.userId,
        present: item.present,
        notes: item.notes,
      }));

      const res = await markSessionAttendance(activeSession._id, payload);
      if (res.success && res.data) {
        setShowFinalizeModal(false);
        setSubmitSuccessMsg(
          'Attendance finalized successfully. Enrollees attending all sessions have been unlocked for assessment.'
        );
        await loadData();
        selectSession(res.data);
      }
    } catch (err: any) {
      setErrorMessage(err.response?.data?.error || err.message || 'Failed to save attendance.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Schedule Session Handler
  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!program?._id || !newTitle || !newScheduledDate) return;
    try {
      setCreatingSession(true);
      const res = await createSession(program._id, {
        title: newTitle,
        description: newDescription,
        scheduledDate: newScheduledDate,
        startTime: newStartTime,
        endTime: newEndTime,
        venueOrLink: newVenueOrLink,
      });
      if (res.success) {
        setShowCreateModal(false);
        setNewTitle('');
        setNewDescription('');
        setNewScheduledDate('');
        setNewVenueOrLink('');
        await loadData();
        if (res.data) selectSession(res.data);
      }
    } catch (err: any) {
      setErrorMessage(err.response?.data?.error || err.message || 'Failed to create session.');
    } finally {
      setCreatingSession(false);
    }
  };

  // Filtered Roster
  const filteredRoster = useMemo(() => {
    if (!searchQuery.trim()) return rosterDraft;
    const q = searchQuery.toLowerCase();
    return rosterDraft.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.email.toLowerCase().includes(q) ||
        (a.department && a.department.toLowerCase().includes(q))
    );
  }, [rosterDraft, searchQuery]);

  // Metrics
  const totalRoster = rosterDraft.length;
  const presentCount = rosterDraft.filter((a) => a.present).length;
  const absentCount = totalRoster - presentCount;
  const attendanceRate = totalRoster > 0 ? Math.round((presentCount / totalRoster) * 100) : 0;

  // Personal Status for General Faculty
  const myRosterRecord = useMemo(() => {
    if (!user || !rosterDraft) return null;
    return rosterDraft.find((a) => String(a.userId) === String(user._id));
  }, [user, rosterDraft]);

  if (loading) return <LoadingSpinner text="Loading training sessions & attendance roster..." />;

  const programId = program?._id || routeProgramId;

  return (
    <div className="space-y-6 animate-fadeIn pb-16">
      {/* ── Top Header Navigation ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <Link
              to="/training/catalog"
              className="hover:text-blue-600 transition-colors flex items-center gap-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Training Programs</span>
            </Link>
            <span>/</span>
            {programId && (
              <Link
                to={`/training/${programId}/learn`}
                className="hover:text-blue-600 transition-colors flex items-center gap-1"
              >
                <span>Course Delivery LMS</span>
              </Link>
            )}
            <span>/</span>
            <span className="text-slate-800">Sessions &amp; Attendance</span>
          </div>

          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {program?.title || 'Program Sessions & Attendance Roster'}
          </h1>
          <p className="text-xs text-slate-500">
            Multi-session schedule, atomic organiser self-assignment, and verified attendance checkoff
          </p>
        </div>

        <div className="flex items-center gap-2">
          {programId && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/training/${programId}/learn`)}
              className="flex items-center gap-1.5"
            >
              <PlayCircle className="w-3.5 h-3.5 text-blue-600" />
              <span>Go to Course LMS</span>
            </Button>
          )}

          {isPrivileged && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Schedule Session</span>
            </Button>
          )}
        </div>
      </div>

      {/* Messages */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {submitSuccessMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{submitSuccessMsg}</span>
        </div>
      )}

      {/* ── Main Layout: Sessions Sidebar + Active Session Roster ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Scheduled Sessions List (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              <span>Program Schedule ({sessions.length})</span>
            </h3>
            {isPrivileged && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors"
              >
                + New
              </button>
            )}
          </div>

          {sessions.length === 0 ? (
            <Card className="p-6 text-center space-y-3">
              <Calendar className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="text-xs text-slate-500 font-medium">No scheduled sessions found for this program.</p>
              {isPrivileged && (
                <Button variant="outline" size="sm" onClick={() => setShowCreateModal(true)}>
                  Schedule First Session
                </Button>
              )}
            </Card>
          ) : (
            <div className="space-y-3">
              {sessions.map((sess, idx) => {
                const isSelected = activeSession?._id === sess._id;
                const sessOrg = sess.organiserId as any;
                const hasOrganiser = !!sessOrg;
                const isMySession = sessOrg && String(sessOrg._id || sessOrg) === String(user?._id);

                return (
                  <Card
                    key={sess._id}
                    hover
                    onClick={() => selectSession(sess)}
                    className={`p-4 cursor-pointer transition-all border-2 ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/30 shadow-sm'
                        : 'border-slate-200/80 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            Session {idx + 1}
                          </span>
                          {sess.status === 'attendance_marked' ? (
                            <Badge variant="success" className="text-[10px] py-0 px-1.5">
                              Finalized
                            </Badge>
                          ) : hasOrganiser ? (
                            <Badge variant="teal" className="text-[10px] py-0 px-1.5">
                              Organiser Set
                            </Badge>
                          ) : (
                            <Badge variant="warning" className="text-[10px] py-0 px-1.5">
                              Unclaimed
                            </Badge>
                          )}
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 mt-1 line-clamp-1">{sess.title}</h4>
                      </div>
                    </div>

                    <div className="mt-3 space-y-1.5 text-xs text-slate-500 border-t border-slate-100 pt-2.5">
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>
                          {new Date(sess.scheduledDate).toLocaleDateString()}
                          {sess.startTime ? ` • ${sess.startTime}` : ''}
                        </span>
                      </div>

                      {sess.venueOrLink && (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{sess.venueOrLink}</span>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-1 text-[11px]">
                        <span className="text-slate-600 font-medium">
                          Organiser:{' '}
                          <strong className="text-slate-900">
                            {hasOrganiser ? (isMySession ? 'You' : sessOrg.name || 'Assigned') : 'None'}
                          </strong>
                        </span>
                        <span className="text-slate-500">
                          {sess.presentCount ?? 0}/{sess.totalAttendees ?? sess.attendees?.length ?? 0} present
                        </span>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Active Session Detail & Roster (8 cols) */}
        <div className="lg:col-span-8 space-y-5">
          {activeSession ? (
            <div className="space-y-5">
              {/* Active Session Banner Card */}
              <Card className="p-6 border-slate-200">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-extrabold uppercase tracking-wider text-blue-600">
                        Active Training Session
                      </span>
                      {isFinalized ? (
                        <Badge variant="success" icon={<Lock className="w-3 h-3" />}>
                          Attendance Finalized &amp; Locked
                        </Badge>
                      ) : activeSession.organiserId ? (
                        <Badge variant="teal" icon={<UserCheck className="w-3 h-3" />}>
                          Organiser Assigned
                        </Badge>
                      ) : (
                        <Badge variant="warning" icon={<AlertCircle className="w-3 h-3" />}>
                          Open for Self-Assignment
                        </Badge>
                      )}
                    </div>
                    <h2 className="text-xl font-bold text-slate-900">{activeSession.title}</h2>
                    {activeSession.description && (
                      <p className="text-xs text-slate-600">{activeSession.description}</p>
                    )}
                  </div>

                  {/* Organiser Action Buttons */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {!activeSession.organiserId && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => setShowClaimModal(activeSession)}
                        className="flex items-center gap-1.5 shadow-sm"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Self-Assign as Organiser</span>
                      </Button>
                    )}

                    {activeSession.organiserId && (isOrganiser || isPrivileged) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowUnclaimModal(activeSession)}
                        className="text-slate-600 hover:text-rose-600 text-xs"
                      >
                        {isPrivileged && !isOrganiser ? 'Unassign Organiser' : 'Step Down as Organiser'}
                      </Button>
                    )}
                  </div>
                </div>

                {/* Session Meta Bar */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 text-xs">
                  <div className="flex items-center gap-2 text-slate-600">
                    <Calendar className="w-4 h-4 text-blue-600 shrink-0" />
                    <div>
                      <div className="font-semibold text-slate-900">Date &amp; Schedule</div>
                      <div>
                        {new Date(activeSession.scheduledDate).toLocaleDateString()}
                        {activeSession.startTime ? ` (${activeSession.startTime} - ${activeSession.endTime || ''})` : ''}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-slate-600">
                    <MapPin className="w-4 h-4 text-teal-600 shrink-0" />
                    <div>
                      <div className="font-semibold text-slate-900">Venue / Platform</div>
                      <div className="truncate">{activeSession.venueOrLink || 'Institutional Campus Lab'}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-slate-600">
                    <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0" />
                    <div>
                      <div className="font-semibold text-slate-900">Designated Organiser</div>
                      <div>
                        {activeSession.organiserId ? (
                          <span className="font-semibold text-slate-800">
                            {(activeSession.organiserId as any).name || 'Assigned Faculty'}
                            {isOrganiser && ' (You)'}
                          </span>
                        ) : (
                          <span className="text-amber-600 italic">Unassigned</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Personal Status Callout for Enrolled Faculty */}
                {myRosterRecord && !canEditAttendance && (
                  <div className="mt-4 p-3 rounded-xl border bg-slate-50 border-slate-200 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-blue-600" />
                      <span className="text-slate-700">Your Enrolled Session Attendance Status:</span>
                    </div>
                    {myRosterRecord.present ? (
                      <Badge variant="success" icon={<CheckCircle2 className="w-3.5 h-3.5" />}>
                        Marked Present ✓
                      </Badge>
                    ) : (
                      <Badge variant="warning" icon={<Clock className="w-3.5 h-3.5" />}>
                        {isFinalized ? 'Marked Absent' : 'Pending Organiser Roll Call'}
                      </Badge>
                    )}
                  </div>
                )}
              </Card>

              {/* Attendance Finalized Safeguard Alert */}
              {isFinalized && (
                <div className="p-4 rounded-xl border border-emerald-300 bg-emerald-50/70 text-emerald-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3">
                    <Lock className="w-5 h-5 text-emerald-600 shrink-0" />
                    <div>
                      <div className="font-bold text-emerald-900">
                        Attendance Record Finalized by{' '}
                        {(activeSession.attendanceMarkedBy as any)?.name || 'Course Organiser'} on{' '}
                        {activeSession.attendanceMarkedAt
                          ? new Date(activeSession.attendanceMarkedAt).toLocaleString()
                          : 'Institutional Record'}
                      </div>
                      <div className="text-emerald-800 mt-0.5">
                        This roster is locked against uncoordinated edits. Enrollees who satisfied all session requirements have been unlocked for LMS assessment.
                      </div>
                    </div>
                  </div>

                  {isPrivileged && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        // Admin override to edit roster
                        setErrorMessage(null);
                        setSubmitSuccessMsg(null);
                      }}
                      className="border-emerald-300 bg-white text-emerald-800 hover:bg-emerald-50 shrink-0"
                    >
                      <Unlock className="w-3.5 h-3.5 mr-1" />
                      Re-Save Roster (Admin)
                    </Button>
                  )}
                </div>
              )}

              {/* Roster & Checkoff Section */}
              <Card className="p-6 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-100">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <Users className="w-4 h-4 text-blue-600" />
                      <span>Attendee Roster &amp; Verification</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Check each attendee present for this session. Changes sync directly to the program completion pipeline.
                    </p>
                  </div>

                  {/* Quick Metrics Chips */}
                  <div className="flex items-center gap-2 text-xs">
                    <span className="px-2.5 py-1 rounded-lg bg-slate-100 font-semibold text-slate-700">
                      Total: {totalRoster}
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-100 font-semibold text-emerald-800">
                      Present: {presentCount}
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-rose-100 font-semibold text-rose-800">
                      Absent: {absentCount}
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-blue-100 font-bold text-blue-800">
                      {attendanceRate}%
                    </span>
                  </div>
                </div>

                {/* Filter & Batch Action Toolbar */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="w-full sm:w-72">
                    <SearchBar
                      value={searchQuery}
                      onChange={setSearchQuery}
                      placeholder="Search enrollees by name or email..."
                    />
                  </div>

                  {canEditAttendance && !isLockedForCurrentUser && (
                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => markAll(true)}
                        className="text-xs font-semibold text-emerald-700 border-emerald-300 hover:bg-emerald-50"
                      >
                        <UserCheck className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                        Mark All Present
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => markAll(false)}
                        className="text-xs font-semibold text-rose-700 border-rose-300 hover:bg-rose-50"
                      >
                        <UserX className="w-3.5 h-3.5 mr-1 text-rose-600" />
                        Mark All Absent
                      </Button>
                    </div>
                  )}
                </div>

                {/* Roster Table / Cards */}
                {filteredRoster.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-500 font-medium">
                    {searchQuery ? 'No attendees match your search query.' : 'No enrollees registered for this program yet.'}
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white">
                    {filteredRoster.map((attendee) => {
                      const isMe = String(attendee.userId) === String(user?._id);

                      return (
                        <div
                          key={attendee.userId}
                          className={`p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                            attendee.present ? 'bg-emerald-50/20' : 'hover:bg-slate-50/50'
                          } ${isMe ? 'ring-1 ring-blue-500/30' : ''}`}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={attendee.present}
                              disabled={isLockedForCurrentUser || !canEditAttendance}
                              onChange={() => toggleAttendance(attendee.userId)}
                              className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 focus:ring-2 cursor-pointer disabled:cursor-not-allowed"
                            />

                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-xs text-slate-900">{attendee.name}</span>
                                {isMe && (
                                  <Badge variant="blue" className="text-[10px] py-0 px-1.5">
                                    You
                                  </Badge>
                                )}
                                {attendee.department && (
                                  <span className="text-[10px] text-slate-400 font-medium">
                                    • {attendee.department}
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-500">{attendee.email}</div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 justify-between sm:justify-end">
                            {/* Notes input */}
                            {canEditAttendance && !isLockedForCurrentUser ? (
                              <input
                                type="text"
                                value={attendee.notes}
                                onChange={(e) => updateNote(attendee.userId, e.target.value)}
                                placeholder="Add remark / note..."
                                className="text-xs px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 w-44"
                              />
                            ) : attendee.notes ? (
                              <span className="text-[11px] text-slate-500 italic">“{attendee.notes}”</span>
                            ) : null}

                            <div className="shrink-0">
                              {attendee.present ? (
                                <Badge variant="success" className="text-[10px]">
                                  Present ✓
                                </Badge>
                              ) : (
                                <Badge variant="muted" className="text-[10px]">
                                  Absent
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Finalize Action Bottom Bar */}
                {canEditAttendance && !isLockedForCurrentUser && (
                  <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="text-xs text-slate-500">
                      Present: <strong>{presentCount}</strong> / {totalRoster} enrollees selected.
                    </div>

                    <Button
                      variant="primary"
                      size="md"
                      loading={isSubmitting}
                      onClick={() => setShowFinalizeModal(true)}
                      className="flex items-center gap-2 shadow-sm"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Finalize &amp; Submit Attendance</span>
                    </Button>
                  </div>
                )}
              </Card>
            </div>
          ) : (
            <EmptyState
              title="No session selected"
              description="Please choose a session from the schedule sidebar to view its roster and mark attendance."
            />
          )}
        </div>
      </div>

      {/* ── MODAL: Self-Assign as Organiser Confirmation ── */}
      <Modal
        open={!!showClaimModal}
        onClose={() => setShowClaimModal(null)}
        title="Confirm Session Organiser Assignment"
        size="md"
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <Button variant="ghost" size="sm" onClick={() => setShowClaimModal(null)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              loading={isSubmitting}
              onClick={() => showClaimModal && handleAssignOrganiser(showClaimModal)}
            >
              Confirm Assignment
            </Button>
          </div>
        }
      >
        <div className="space-y-3 text-xs text-slate-600">
          <p>
            You are designating yourself as the official session organiser for:
          </p>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-900 font-bold">
            {showClaimModal?.title}
          </div>
          <p>
            As organiser, you will have exclusive authority to verify enrollees, record presence, and submit the final attendance roster. An email and in-app notification confirming your role will be recorded in your dashboard.
          </p>
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
            <span>
              If you are unable to fulfill this duty, any Department Head (HOD) or Academic Dean may reassign or release this role.
            </span>
          </div>
        </div>
      </Modal>

      {/* ── MODAL: Unassign Organiser Confirmation ── */}
      <Modal
        open={!!showUnclaimModal}
        onClose={() => setShowUnclaimModal(null)}
        title="Release Organiser Role"
        size="md"
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <Button variant="ghost" size="sm" onClick={() => setShowUnclaimModal(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              loading={isSubmitting}
              onClick={() => showUnclaimModal && handleUnassignOrganiser(showUnclaimModal)}
            >
              Release Role
            </Button>
          </div>
        }
      >
        <div className="space-y-3 text-xs text-slate-600">
          <p>
            Are you sure you want to release the organiser role for <strong>{showUnclaimModal?.title}</strong>?
          </p>
          <p>
            The session will return to the unclaimed schedule pool, allowing another faculty member or department head to take over attendance duties.
          </p>
        </div>
      </Modal>

      {/* ── MODAL: Finalize Attendance Confirmation ── */}
      <Modal
        open={showFinalizeModal}
        onClose={() => setShowFinalizeModal(false)}
        title="Finalize Session Attendance"
        size="md"
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <Button variant="ghost" size="sm" onClick={() => setShowFinalizeModal(false)}>
              Cancel &amp; Keep Editing
            </Button>
            <Button
              variant="primary"
              size="sm"
              loading={isSubmitting}
              onClick={handleSaveAttendance}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Confirm &amp; Finalize Attendance
            </Button>
          </div>
        }
      >
        <div className="space-y-3 text-xs text-slate-600">
          <p>
            You are about to finalize attendance for <strong>{activeSession?.title}</strong>:
          </p>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-2 gap-2 text-center">
            <div>
              <div className="text-[10px] uppercase text-slate-400 font-bold">Present</div>
              <div className="text-base font-extrabold text-emerald-600">{presentCount}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase text-slate-400 font-bold">Absent</div>
              <div className="text-base font-extrabold text-rose-600">{absentCount}</div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 flex items-start gap-2">
            <Sparkles className="w-4 h-4 shrink-0 text-blue-600 mt-0.5" />
            <span>
              <strong>Automated Eligibility Sync:</strong> Enrollees who have now completed attendance for all scheduled program sessions will automatically have their status set to <em>attended</em>, unlocking the certification assessment test.
            </span>
          </div>

          <p className="text-slate-500">
            Once submitted, this record is locked. Further adjustments will require HOD or Administrator override.
          </p>
        </div>
      </Modal>

      {/* ── MODAL: Schedule New Session (Admin / HOD) ── */}
      <Modal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Schedule New Training Session"
        size="md"
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <Button variant="ghost" size="sm" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              loading={creatingSession}
              onClick={handleCreateSession}
            >
              Create Session
            </Button>
          </div>
        }
      >
        <form onSubmit={handleCreateSession} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Session Title *</label>
            <input
              type="text"
              required
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="e.g., Session 1: Deep Learning Foundations & Transformers"
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Description / Agenda</label>
            <textarea
              rows={2}
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="Key topics, lecture modules, or laboratory exercises..."
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Scheduled Date *</label>
            <input
              type="date"
              required
              value={newScheduledDate}
              onChange={(e) => setNewScheduledDate(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Start Time</label>
              <input
                type="text"
                value={newStartTime}
                onChange={(e) => setNewStartTime(e.target.value)}
                placeholder="10:00 AM"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">End Time</label>
              <input
                type="text"
                value={newEndTime}
                onChange={(e) => setNewEndTime(e.target.value)}
                placeholder="01:00 PM"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Venue or Meeting Link</label>
            <input
              type="text"
              value={newVenueOrLink}
              onChange={(e) => setNewVenueOrLink(e.target.value)}
              placeholder="e.g., Seminar Hall A / https://meet.google.com/xyz-abc"
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};
