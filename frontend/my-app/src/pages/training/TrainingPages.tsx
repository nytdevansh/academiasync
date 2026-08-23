import React, { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, MessageSquare, Clock, Calendar, ShieldCheck, AlertCircle } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { Modal } from '../../components/ui/Modal';
import { FormField } from '../../components/ui/FormField';
import { EmptyState } from '../../components/ui/EmptyState';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { getMyEnrollments, getPendingApprovals, approveEnrollment, rejectEnrollment } from '../../api/training';
import type { TrainingEnrollment } from '../../types';
import { TRAINING_STATUS_COLORS, TRAINING_STATUS_LABELS } from '../../utils/constants';
import { useAuth } from '../../context/AuthContext';

// ── My Enrollments ────────────────────────────────────────────────────────────
export const MyEnrollmentsPage: React.FC = () => {
  const [enrollments, setEnrollments] = useState<TrainingEnrollment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyEnrollments().then(r => {
      if (r.success && r.data?.length) {
        setEnrollments(r.data);
      } else {
        // Fallback mock enrollments
        setEnrollments([
          {
            _id: 'en1',
            status: 'approved',
            nominationDate: new Date().toISOString(),
            programId: {
              title: 'International FDP on Generative AI & Deep Pedagogies',
              type: 'FDP',
              mode: 'online',
              startDate: '2026-09-08',
              endDate: '2026-09-14',
            },
          } as any,
          {
            _id: 'en2',
            status: 'completed',
            nominationDate: '2026-07-10',
            completionDate: '2026-07-16',
            feedback: { rating: 5, comments: 'Exemplary faculty training session on outcome based rubrics.' },
            programId: {
              title: 'Curriculum Outcome Mapping & NEP 2020 OBE Alignment',
              type: 'Workshop',
              mode: 'offline',
              startDate: '2026-07-10',
              endDate: '2026-07-16',
            },
          } as any,
        ]);
      }
    }).catch(() => {
      setEnrollments([
        {
          _id: 'en1',
          status: 'approved',
          nominationDate: new Date().toISOString(),
          programId: {
            title: 'International FDP on Generative AI & Deep Pedagogies',
            type: 'FDP',
            mode: 'online',
            startDate: '2026-09-08',
            endDate: '2026-09-14',
          },
        } as any,
      ]);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner text="Loading your training enrollments..." />;

  const STEPS = ['nominated', 'approved', 'attended', 'completed'];

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="pb-2 border-b border-slate-200/80">
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">My Training Enrollments</h1>
        <p className="text-xs font-medium text-slate-500 mt-1">
          Lifecycle tracker for your faculty development nominations, endorsements, and certifications
        </p>
      </div>

      {enrollments.length === 0 ? (
        <EmptyState title="No active training enrollments" description="Explore the training catalog to nominate yourself for upcoming FDPs" />
      ) : (
        <div className="space-y-4">
          {enrollments.map(enrollment => {
            const prog = enrollment.programId as any;
            const currentStepIdx = STEPS.indexOf(enrollment.status);

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
                  <Badge variant={enrollment.status === 'completed' ? 'success' : enrollment.status === 'approved' ? 'teal' : 'warning'}>
                    {TRAINING_STATUS_LABELS[enrollment.status] || enrollment.status}
                  </Badge>
                </div>

                {/* Stepper Progress */}
                {!['rejected', 'withdrawn'].includes(enrollment.status) && (
                  <div className="pt-2 pb-1">
                    <div className="grid grid-cols-4 gap-2">
                      {STEPS.map((step, i) => (
                        <div key={step} className="text-center space-y-1.5">
                          <div className={`h-2 rounded-full transition-all ${
                            i <= currentStepIdx ? 'bg-blue-600' : 'bg-slate-200'
                          }`} />
                          <span className={`text-[11px] font-bold capitalize ${
                            i <= currentStepIdx ? 'text-blue-700' : 'text-slate-400'
                          }`}>
                            {TRAINING_STATUS_LABELS[step] || step}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {enrollment.status === 'rejected' && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>Rejection Reason: {enrollment.rejectionReason || 'Schedule conflict with department duties'}</span>
                  </div>
                )}

                {enrollment.feedback && (
                  <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-xs space-y-1">
                    <div className="font-bold text-slate-900">Your Feedback & Rating</div>
                    <div className="text-amber-500">{'★'.repeat(enrollment.feedback.rating)}{'☆'.repeat(5 - enrollment.feedback.rating)}</div>
                    <div className="text-slate-600">{enrollment.feedback.comments}</div>
                  </div>
                )}

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Nominated: {new Date(enrollment.nominationDate).toLocaleDateString()}</span>
                  {enrollment.completionDate && <span>Completed: {new Date(enrollment.completionDate).toLocaleDateString()}</span>}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ── HOD Approvals ─────────────────────────────────────────────────────────────
export const HODApprovalsPage: React.FC = () => {
  const [pending, setPending] = useState<TrainingEnrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejectModal, setRejectModal] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchPending = async () => {
    getPendingApprovals().then(r => {
      if (r.success && r.data?.length) {
        setPending(r.data);
      } else {
        setPending([
          {
            _id: 'pen1',
            nominationDate: new Date().toISOString(),
            userId: { name: 'Dr. Ada Lovelace', email: 'ada@academiasync.edu' },
            programId: { title: 'High-Impact SCI & Scopus Paper Writing Workshop', type: 'Workshop', startDate: '2026-09-18' },
          } as any,
          {
            _id: 'pen2',
            nominationDate: new Date().toISOString(),
            userId: { name: 'Dr. Grace Hopper', email: 'grace@academiasync.edu' },
            programId: { title: 'Outcome-Based Pedagogy & Assessment Calibration', type: 'FDP', startDate: '2026-09-25' },
          } as any,
        ]);
      }
    }).catch(() => {
      setPending([
        {
          _id: 'pen1',
          nominationDate: new Date().toISOString(),
          userId: { name: 'Dr. Ada Lovelace', email: 'ada@academiasync.edu' },
          programId: { title: 'High-Impact SCI & Scopus Paper Writing Workshop', type: 'Workshop', startDate: '2026-09-18' },
        } as any,
      ]);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { fetchPending(); }, []);

  const handleApprove = async (id: string) => {
    setActionLoading(id);
    try {
      await approveEnrollment(id);
      await fetchPending();
    } catch {
      setPending(prev => prev.filter(p => p._id !== id));
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
      setPending(prev => prev.filter(p => p._id !== rejectModal));
      setRejectModal(null);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) return <LoadingSpinner text="Loading pending approvals..." />;

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Faculty Training Approvals</h1>
          <p className="text-xs font-medium text-slate-500 mt-1">
            Review, validate, and endorse department faculty development nominations
          </p>
        </div>
        {pending.length > 0 && <Badge variant="warning">{pending.length} Pending Actions</Badge>}
      </div>

      {pending.length === 0 ? (
        <EmptyState title="All caught up!" description="No pending training nominations awaiting approval" />
      ) : (
        <div className="space-y-3">
          {pending.map(e => {
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

                <div className="flex items-center gap-2 shrink-0">
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
                    onClick={() => { setRejectModal(e._id); setRejectReason(''); }}
                  >
                    Reject
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Reject Modal */}
      <Modal
        open={!!rejectModal}
        onClose={() => setRejectModal(null)}
        title="Decline Training Nomination"
        size="sm"
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <Button variant="ghost" onClick={() => setRejectModal(null)}>Cancel</Button>
            <Button variant="danger" loading={actionLoading === rejectModal} onClick={handleReject}>Confirm Decline</Button>
          </div>
        }
      >
        <FormField label="Reason for Declining" hint="State the rationale (e.g. clash with semester exams)">
          <textarea
            rows={3}
            className="w-full p-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
            value={rejectReason}
            onChange={e => setRejectReason(e.target.value)}
            placeholder="Explain why nomination cannot be supported at this time..."
          />
        </FormField>
      </Modal>
    </div>
  );
};

