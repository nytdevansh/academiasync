import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  XCircle,
  MessageSquare,
  Clock,
  Calendar,
  ShieldCheck,
  AlertCircle,
  PlayCircle,
  Award,
  RotateCcw,
  AlertTriangle,
  History,
  CheckSquare,
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { Modal } from '../../components/ui/Modal';
import { FormField } from '../../components/ui/FormField';
import { EmptyState } from '../../components/ui/EmptyState';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { getMyEnrollments, getPendingApprovals, getRetakeCandidates, approveEnrollment, rejectEnrollment } from '../../api/training';
import { resetEnrollmentForRetake } from '../../api/lms';
import type { TrainingEnrollment } from '../../types';
import { TRAINING_STATUS_COLORS, TRAINING_STATUS_LABELS } from '../../utils/constants';
import { useAuth } from '../../context/AuthContext';

// ── My Enrollments ────────────────────────────────────────────────────────────
export const MyEnrollmentsPage: React.FC = () => {
  const navigate = useNavigate();
  const [enrollments, setEnrollments] = useState<TrainingEnrollment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyEnrollments()
      .then((r) => {
        if (r.success && r.data) {
          setEnrollments(r.data);
        } else {
          setEnrollments([]);
        }
      })
      .catch(() => {
        setEnrollments([]);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner text="Loading your training enrollments..." />;

  // 5 Steps if certified, 4 steps otherwise
  const BASE_STEPS = ['nominated', 'approved', 'attended', 'completed'];

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      <div className="pb-2 border-b border-slate-200/80">
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">My Training Enrollments</h1>
        <p className="text-xs font-medium text-slate-500 mt-1">
          Lifecycle tracker for your faculty development nominations, endorsements, and official certifications
        </p>
      </div>

      {enrollments.length === 0 ? (
        <EmptyState
          title="No active training enrollments"
          description="Explore the training catalog to nominate yourself for upcoming FDPs and workshops"
        />
      ) : (
        <div className="space-y-4">
          {enrollments.map((enrollment) => {
            const prog = enrollment.programId as any;
            const isCert = enrollment.status === 'certified';
            const displaySteps = isCert ? [...BASE_STEPS, 'certified'] : BASE_STEPS;
            const currentStepIdx = isCert ? 4 : BASE_STEPS.indexOf(enrollment.status);

            return (
              <Card key={enrollment._id} className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <Badge variant="info">{prog?.type || 'FDP'}</Badge>
                      <Badge variant="muted">{prog?.mode || 'online'}</Badge>
                    </div>
                    <h3 className="text-base font-bold text-slate-900">{prog?.title}</h3>
                  </div>
                  <Badge
                    variant={
                      isCert
                        ? 'success'
                        : enrollment.status === 'completed'
                        ? 'success'
                        : enrollment.status === 'approved'
                        ? 'teal'
                        : 'warning'
                    }
                  >
                    {isCert
                      ? 'Certified ✓'
                      : TRAINING_STATUS_LABELS[enrollment.status] || enrollment.status}
                  </Badge>
                </div>

                {/* Stepper Progress */}
                {!['rejected', 'withdrawn'].includes(enrollment.status) && (
                  <div className="pt-2 pb-1">
                    <div className={`grid gap-2 ${isCert ? 'grid-cols-5' : 'grid-cols-4'}`}>
                      {displaySteps.map((step, i) => {
                        const isPastOrCur = i <= currentStepIdx;
                        const isThisCert = step === 'certified';

                        return (
                          <div key={step} className="text-center space-y-1.5">
                            <div
                              className={`h-2 rounded-full transition-all ${
                                isThisCert && isPastOrCur
                                  ? 'bg-amber-500'
                                  : isPastOrCur
                                  ? 'bg-blue-600'
                                  : 'bg-slate-200'
                              }`}
                            />
                            <span
                              className={`text-[10px] sm:text-[11px] font-bold capitalize truncate block ${
                                isThisCert && isPastOrCur
                                  ? 'text-amber-700 font-extrabold'
                                  : isPastOrCur
                                  ? 'text-blue-700'
                                  : 'text-slate-400'
                              }`}
                            >
                              {step === 'certified' ? 'Certified ✓' : TRAINING_STATUS_LABELS[step] || step}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {enrollment.status === 'rejected' && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>Rejection Reason: {enrollment.rejectionReason || 'Schedule conflict with department duties'}</span>
                  </div>
                )}

                {enrollment.status === 'withdrawn' && (
                  <div className="p-3 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-600 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>Enrollment Withdrawn: This training registration was cancelled before completion.</span>
                  </div>
                )}

                {enrollment.feedback && (
                  <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-xs space-y-1">
                    <div className="font-bold text-slate-900">Your Feedback &amp; Rating</div>
                    <div className="text-amber-500">
                      {'★'.repeat(enrollment.feedback.rating)}
                      {'☆'.repeat(5 - enrollment.feedback.rating)}
                    </div>
                    <div className="text-slate-600">{enrollment.feedback.comments}</div>
                  </div>
                )}

                <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-400">
                  <div className="flex items-center gap-3">
                    <span>Nominated: {new Date(enrollment.nominationDate).toLocaleDateString()}</span>
                    {enrollment.completionDate && (
                      <span>Completed: {new Date(enrollment.completionDate).toLocaleDateString()}</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {isCert && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate('/certificates')}
                        className="flex items-center gap-1.5 text-amber-700 border-amber-300 bg-amber-50/50 hover:bg-amber-100/60"
                      >
                        <Award className="w-3.5 h-3.5 text-amber-600" />
                        <span>View Certificate</span>
                      </Button>
                    )}
                    {prog?._id && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate(`/training/programs/${prog._id}/sessions`)}
                        className="flex items-center gap-1.5 text-slate-700"
                        title="View scheduled sessions and attendance"
                      >
                        <Calendar className="w-3.5 h-3.5 text-blue-600" />
                        <span>Sessions</span>
                      </Button>
                    )}

                    {['approved', 'attended', 'completed', 'certified'].includes(enrollment.status) && (
                      <Button
                        size="sm"
                        variant={isCert ? 'outline' : 'primary'}
                        onClick={() => {
                          if (prog?._id) navigate(`/training/${prog._id}/learn`);
                        }}
                        className="flex items-center gap-1.5"
                      >
                        <PlayCircle className="w-3.5 h-3.5" />
                        <span>
                          {isCert
                            ? 'Review Course'
                            : enrollment.status === 'completed'
                            ? 'Take Assessment & Certify'
                            : 'Go to Course'}
                        </span>
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ── HOD Approvals & Retake Reset Management ──────────────────────────────────
export const HODApprovalsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'nominations' | 'retakes'>('nominations');
  const [pending, setPending] = useState<TrainingEnrollment[]>([]);
  const [retakeEnrollments, setRetakeEnrollments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Nomination Rejection Modal
  const [rejectModal, setRejectModal] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Retake Reset Modal
  const [resetModalEnrollment, setResetModalEnrollment] = useState<any | null>(null);
  const [resetReason, setResetReason] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  const fetchPending = async () => {
    try {
      const [r, retakeRes] = await Promise.all([
        getPendingApprovals(),
        getRetakeCandidates(),
      ]);
      if (r.success && r.data) {
        setPending(r.data);
      } else {
        setPending([]);
      }

      if (retakeRes.success && retakeRes.data) {
        setRetakeEnrollments(retakeRes.data);
      } else {
        setRetakeEnrollments([]);
      }
    } catch {
      setPending([]);
      setRetakeEnrollments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const handleApprove = async (id: string) => {
    setActionLoading(id);
    try {
      await approveEnrollment(id);
      await fetchPending();
    } catch {
      setPending((prev) => prev.filter((p) => p._id !== id));
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (!rejectModal) return;
    setActionLoading(rejectModal);
    try {
      await rejectEnrollment(rejectModal, rejectReason || 'Rejected by HOD');
      setRejectModal(null);
      await fetchPending();
    } catch {
      setPending((prev) => prev.filter((p) => p._id !== rejectModal));
      setRejectModal(null);
    } finally {
      setActionLoading(null);
    }
  };

  const handleGrantRetakeReset = async () => {
    if (!resetModalEnrollment || !resetReason.trim()) return;
    setResetLoading(true);
    try {
      const progId = resetModalEnrollment.programId?._id || resetModalEnrollment.programId;
      await resetEnrollmentForRetake(progId, resetModalEnrollment._id, resetReason.trim());
      alert('Retake reset successfully granted. Attempts counter reset to 0.');
      setResetModalEnrollment(null);
      setResetReason('');
      await fetchPending();
    } catch (err: any) {
      alert(err.response?.data?.error || err.message || 'Failed to grant retake reset');
    } finally {
      setResetLoading(false);
    }
  };

  if (loading) return <LoadingSpinner text="Loading pending approvals & retake requests..." />;

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Faculty Training Management</h1>
          <p className="text-xs font-medium text-slate-500 mt-1">
            Review training nominations and administer assessment retake resets for faculty
          </p>
        </div>
        <div className="flex items-center gap-2">
          {pending.length > 0 && <Badge variant="warning">{pending.length} Nominations</Badge>}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('nominations')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'nominations'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <CheckSquare className="w-4 h-4" />
          <span>Pending Nominations ({pending.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('retakes')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'retakes'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <RotateCcw className="w-4 h-4" />
          <span>Assessment Retake Resets ({retakeEnrollments.length})</span>
        </button>
      </div>

      {/* ── TAB 1: NOMINATIONS ── */}
      {activeTab === 'nominations' && (
        <>
          {pending.length === 0 ? (
            <EmptyState title="All caught up!" description="No pending training nominations awaiting endorsement" />
          ) : (
            <div className="space-y-3">
              {pending.map((e) => {
                const prog = e.programId as any;
                const faculty = e.userId as any;
                return (
                  <Card key={e._id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <Avatar name={faculty?.name || 'F'} size="md" />
                      <div>
                        <div className="font-bold text-sm text-slate-900">{faculty?.name || 'Dr. Faculty Member'}</div>
                        <div className="text-xs text-slate-500">{faculty?.email || 'faculty@academiasync.edu'}</div>
                      </div>
                    </div>

                    <div className="flex-1 md:px-6 space-y-1">
                      <div className="font-semibold text-xs text-slate-900">{prog?.title}</div>
                      <div className="flex items-center gap-2">
                        <Badge variant="info">{prog?.type}</Badge>
                        <span className="text-[11px] text-slate-400">
                          Start: {prog?.startDate ? new Date(prog.startDate).toLocaleDateString() : 'Sep 2026'}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 shrink-0">
                      <Button
                        variant="success"
                        size="sm"
                        loading={actionLoading === e._id}
                        onClick={() => handleApprove(e._id)}
                      >
                        Approve Endorsement
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => {
                          setRejectModal(e._id);
                          setRejectReason('');
                        }}
                      >
                        Reject
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ── TAB 2: RETAKE RESETS ── */}
      {activeTab === 'retakes' && (
        <>
          {retakeEnrollments.length === 0 ? (
            <EmptyState
              title="No Retake Reset Requests"
              description="No faculty members have currently exhausted their assessment attempts."
            />
          ) : (
            <div className="space-y-3">
              {retakeEnrollments.map((e) => {
                const prog = e.programId as any;
                const faculty = e.userId as any;
                const isExhausted = e.attemptsCount >= (prog?.maxAttempts || 3);

                return (
                  <Card key={e._id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <Avatar name={faculty?.name || 'F'} size="md" />
                      <div>
                        <div className="font-bold text-sm text-slate-900">{faculty?.name}</div>
                        <div className="text-xs text-slate-500">{faculty?.email}</div>
                      </div>
                    </div>

                    <div className="flex-1 md:px-6 space-y-1 text-xs">
                      <div className="font-semibold text-slate-900">{prog?.title}</div>
                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                        <Badge variant={isExhausted ? 'danger' : 'warning'}>
                          Attempts Used: {e.attemptsCount} of {prog?.maxAttempts || 3}
                        </Badge>
                        {e.lastFailedAttemptAt && (
                          <span>
                            Last Failed Attempt: {new Date(e.lastFailedAttemptAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setResetModalEnrollment(e);
                          setResetReason('');
                        }}
                        className="flex items-center gap-1.5 text-blue-700 border-blue-300 bg-blue-50/50 hover:bg-blue-100/60"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Grant Retake Reset</span>
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Reject Nomination Modal */}
      <Modal
        open={!!rejectModal}
        onClose={() => setRejectModal(null)}
        title="Decline Training Nomination"
        size="sm"
        footer={
          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 w-full">
            <Button variant="ghost" onClick={() => setRejectModal(null)}>
              Cancel
            </Button>
            <Button variant="danger" loading={actionLoading === rejectModal} onClick={handleReject}>
              Confirm Decline
            </Button>
          </div>
        }
      >
        <FormField label="Reason for Declining" hint="State the rationale (e.g. clash with semester exams)">
          <textarea
            rows={3}
            className="w-full p-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Explain why nomination cannot be supported at this time..."
          />
        </FormField>
      </Modal>

      {/* Grant Retake Reset Modal (Displays Failure History Context) */}
      <Modal
        open={!!resetModalEnrollment}
        onClose={() => setResetModalEnrollment(null)}
        title="Authorize Assessment Retake Reset"
        size="md"
        footer={
          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 w-full">
            <Button variant="ghost" onClick={() => setResetModalEnrollment(null)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              loading={resetLoading}
              disabled={!resetReason.trim()}
              onClick={handleGrantRetakeReset}
            >
              Confirm &amp; Reset Counters
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          {/* Failure History Summary for Administrator Context */}
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs space-y-2 text-amber-950">
            <div className="font-bold flex items-center gap-1.5 text-amber-900">
              <History className="w-4 h-4 text-amber-600" />
              <span>Faculty Assessment History</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1 border-t border-amber-200/60">
              <div>
                <span className="text-slate-500 font-medium block">Faculty:</span>
                <strong className="text-slate-800">{resetModalEnrollment?.userId?.name}</strong>
              </div>
              <div>
                <span className="text-slate-500 font-medium block">Course:</span>
                <strong className="text-slate-800">{resetModalEnrollment?.programId?.title}</strong>
              </div>
              <div>
                <span className="text-slate-500 font-medium block">Attempts Used:</span>
                <strong className="text-rose-700">
                  {resetModalEnrollment?.attemptsCount} of {resetModalEnrollment?.programId?.maxAttempts || 3} (Locked)
                </strong>
              </div>
              <div>
                <span className="text-slate-500 font-medium block">Last Failed Attempt:</span>
                <strong className="text-slate-800">
                  {resetModalEnrollment?.lastFailedAttemptAt
                    ? new Date(resetModalEnrollment.lastFailedAttemptAt).toLocaleDateString()
                    : 'Recent'}
                </strong>
              </div>
            </div>
          </div>

          <FormField
            label="Administrative Justification Reason (Required)"
            hint="This justification is permanently recorded in the institutional audit log"
          >
            <textarea
              rows={3}
              className="w-full p-2.5 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={resetReason}
              onChange={(e) => setResetReason(e.target.value)}
              placeholder="e.g. Faculty experienced network disconnection during attempt 3; authorized 1 fresh cycle."
            />
          </FormField>
        </div>
      </Modal>
    </div>
  );
};
