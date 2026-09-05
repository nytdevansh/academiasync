import React, { useEffect, useState } from 'react';
import {
  ClipboardList, CheckCircle2, Clock, Award, Send,
  UserCheck, AlertCircle, Building2, Eye, ShieldCheck, ChevronRight
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { Modal } from '../../components/ui/Modal';
import { FormField } from '../../components/ui/FormField';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { getDepartmentAppraisals, submitReviewerAssessment } from '../../api/appraisals';
import { getAllDepartments } from '../../api/departments';
import { useAuth } from '../../context/AuthContext';
import type { Appraisal, Department, AppraisalCriterion } from '../../types';
import { APPRAISAL_STATUS_LABELS } from '../../utils/constants';

const getAppraisalBadgeVariant = (status: string): 'warning' | 'info' | 'success' | 'danger' | 'muted' => {
  switch (status) {
    case 'completed': return 'success';
    case 'self_submitted': return 'info';
    case 'under_review': return 'warning';
    default: return 'muted';
  }
};

export const ReviewerAssessmentPage: React.FC = () => {
  const { user } = useAuth();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDeptId, setSelectedDeptId] = useState<string>('');
  const [appraisals, setAppraisals] = useState<Appraisal[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedAppraisal, setSelectedAppraisal] = useState<Appraisal | null>(null);

  // Reviewer Scoring Form State
  const [reviewerScores, setReviewerScores] = useState<Record<string, { score: number; remarks: string }>>({});
  const [overallRemarks, setOverallRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Determine user's initial department
  useEffect(() => {
    getAllDepartments().then(r => {
      if (r.success && r.data) {
        setDepartments(r.data);
        if (user?.department) {
          const userDeptId = typeof user.department === 'string' ? user.department : (user.department as any)._id;
          setSelectedDeptId(userDeptId);
        } else if (r.data.length > 0) {
          setSelectedDeptId(r.data[0]._id);
        }
      }
    }).catch(console.error);
  }, [user]);

  const loadAppraisals = async (deptId: string) => {
    if (!deptId) return;
    try {
      setLoading(true);
      const res = await getDepartmentAppraisals(deptId);
      if (res.success) {
        setAppraisals(res.data || []);
      }
    } catch (err: any) {
      console.error('Failed to load department appraisals', err);
      // Fallback demo data if empty
      setAppraisals([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedDeptId) {
      loadAppraisals(selectedDeptId);
    }
  }, [selectedDeptId]);

  const handleOpenReviewModal = (appraisal: Appraisal) => {
    setSelectedAppraisal(appraisal);
    const initialScores: Record<string, { score: number; remarks: string }> = {};
    const cycle = appraisal.cycleId as any;

    if (cycle && cycle.criteria) {
      cycle.criteria.forEach((criterion: AppraisalCriterion) => {
        const existingReview = appraisal.reviewerAssessment?.criteria?.find(
          c => c.criterionId.toString() === criterion._id?.toString()
        );
        const selfRating = appraisal.selfAssessment?.criteria?.find(
          c => c.criterionId.toString() === criterion._id?.toString()
        );

        initialScores[criterion._id!] = {
          score: existingReview ? existingReview.score : (selfRating?.score || 0),
          remarks: existingReview ? existingReview.remarks : '',
        };
      });
    }

    setReviewerScores(initialScores);
    setOverallRemarks(appraisal.reviewerAssessment?.overallRemarks || '');
    setError(null);
    setReviewModalOpen(true);
  };

  const handleScoreChange = (criterionId: string, field: 'score' | 'remarks', value: any) => {
    setReviewerScores(prev => ({
      ...prev,
      [criterionId]: {
        ...prev[criterionId],
        [field]: value,
      },
    }));
  };

  // Live calculation of weighted percentage score matching backend algorithm
  const calculateLiveScore = (): number => {
    if (!selectedAppraisal) return 0;
    const cycle = selectedAppraisal.cycleId as any;
    if (!cycle || !cycle.criteria || cycle.criteria.length === 0) return 0;

    let total = 0;
    let maxTotal = 0;

    cycle.criteria.forEach((criterion: AppraisalCriterion) => {
      const reviewerEntry = reviewerScores[criterion._id!];
      const score = reviewerEntry ? Number(reviewerEntry.score) : 0;
      const weight = Number(criterion.weight) || 0;
      const maxScore = Number(criterion.maxScore) || 1;

      total += score * (weight / 100);
      maxTotal += maxScore * (weight / 100);
    });

    return maxTotal > 0 ? Math.round((total / maxTotal) * 100) : 0;
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAppraisal) return;

    setSubmitting(true);
    setError(null);
    try {
      const cycle = selectedAppraisal.cycleId as any;
      const criteriaPayload = cycle.criteria.map((c: AppraisalCriterion) => ({
        criterionId: c._id,
        score: reviewerScores[c._id!]?.score || 0,
        remarks: reviewerScores[c._id!]?.remarks || '',
      }));

      await submitReviewerAssessment(selectedAppraisal._id, {
        criteria: criteriaPayload,
        overallRemarks,
      });

      setReviewModalOpen(false);
      await loadAppraisals(selectedDeptId);
    } catch (err: any) {
      setError(err?.response?.data?.error || err.message || 'Failed to submit reviewer assessment');
    } finally {
      setSubmitting(false);
    }
  };

  const currentDept = departments.find(d => d._id === selectedDeptId);
  const pendingCount = appraisals.filter(a => ['self_submitted', 'under_review'].includes(a.status)).length;
  const completedCount = appraisals.filter(a => a.status === 'completed').length;
  const completedWithScores = appraisals.filter(a => a.status === 'completed' && a.finalScore != null);
  const avgScore = completedWithScores.length > 0
    ? Math.round(completedWithScores.reduce((sum, a) => sum + (a.finalScore || 0), 0) / completedWithScores.length)
    : 0;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Department Appraisal Reviews</h1>
          <p className="text-xs font-medium text-slate-500 mt-1">
            Evaluate submitted faculty self-assessments, apply weighted scoring rubrics, and provide feedback
          </p>
        </div>

        {/* Department Switcher */}
        {['dean', 'administrator'].includes(user?.role || '') ? (
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-slate-400" />
            <select
              value={selectedDeptId}
              onChange={e => setSelectedDeptId(e.target.value)}
              className="px-3 py-1.5 text-xs font-semibold bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            >
              {departments.map(dept => (
                <option key={dept._id} value={dept._id}>
                  {dept.name} ({dept.code})
                </option>
              ))}
            </select>
          </div>
        ) : (
          <Badge variant="teal" className="px-3 py-1 text-xs">
            <Building2 className="w-3.5 h-3.5 mr-1.5 inline" />
            {currentDept ? `${currentDept.name} (${currentDept.code})` : 'My Department'}
          </Badge>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="p-4 border-slate-200">
          <div className="text-xs font-medium text-slate-500">Total Submissions</div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">{appraisals.length}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Faculty in department</div>
        </Card>

        <Card className="p-4 border-amber-200 bg-amber-50/20">
          <div className="text-xs font-medium text-amber-700">Awaiting Evaluation</div>
          <div className="text-2xl font-extrabold text-amber-800 mt-1">{pendingCount}</div>
          <div className="text-[11px] text-amber-600 mt-0.5">Action required</div>
        </Card>

        <Card className="p-4 border-emerald-200 bg-emerald-50/20">
          <div className="text-xs font-medium text-emerald-700">Completed Appraisals</div>
          <div className="text-2xl font-extrabold text-emerald-800 mt-1">{completedCount}</div>
          <div className="text-[11px] text-emerald-600 mt-0.5">Evaluated & scored</div>
        </Card>

        <Card className="p-4 border-blue-200 bg-blue-50/20">
          <div className="text-xs font-medium text-blue-700">Department Avg Score</div>
          <div className="text-2xl font-extrabold text-blue-800 mt-1">{avgScore}%</div>
          <div className="text-[11px] text-blue-600 mt-0.5">Across completed reviews</div>
        </Card>
      </div>

      {/* Submissions Table */}
      {loading ? (
        <LoadingSpinner text="Loading faculty appraisals..." />
      ) : appraisals.length === 0 ? (
        <EmptyState
          title="No Appraisals Found"
          description="There are currently no appraisal submissions from faculty members in this department."
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Faculty Member</th>
                  <th className="px-5 py-3.5">Appraisal Cycle</th>
                  <th className="px-5 py-3.5">Submission Date</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-center">Final Score</th>
                  <th className="px-5 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {appraisals.map(appraisal => {
                  const faculty = appraisal.userId as any;
                  const cycle = appraisal.cycleId as any;
                  const isSubmitted = ['self_submitted', 'under_review'].includes(appraisal.status);

                  return (
                    <tr key={appraisal._id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <Avatar name={faculty?.name || 'Faculty'} size="sm" />
                          <div>
                            <div className="font-bold text-slate-900">{faculty?.name || 'Unknown Faculty'}</div>
                            <div className="text-[11px] text-slate-500">{faculty?.email}</div>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-3.5">
                        <div className="font-semibold text-slate-800">{cycle?.title || 'Annual Cycle'}</div>
                        <div className="text-[11px] text-blue-600 font-medium">AY {cycle?.academicYear}</div>
                      </td>

                      <td className="px-5 py-3.5 text-slate-600">
                        {appraisal.selfAssessment?.submittedAt
                          ? new Date(appraisal.selfAssessment.submittedAt).toLocaleDateString()
                          : 'Not submitted'}
                      </td>

                      <td className="px-5 py-3.5">
                        <Badge variant={getAppraisalBadgeVariant(appraisal.status)}>
                          {APPRAISAL_STATUS_LABELS[appraisal.status] || appraisal.status}
                        </Badge>
                      </td>

                      <td className="px-5 py-3.5 text-center">
                        {appraisal.finalScore !== undefined ? (
                          <span className="font-black text-sm text-blue-600">
                            {appraisal.finalScore}%
                          </span>
                        ) : (
                          <span className="text-slate-400 font-medium">—</span>
                        )}
                      </td>

                      <td className="px-5 py-3.5 text-right">
                        <Button
                          variant={isSubmitted ? 'primary' : 'outline'}
                          size="sm"
                          onClick={() => handleOpenReviewModal(appraisal)}
                        >
                          {isSubmitted ? 'Review & Grade' : 'View / Edit'}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Side-by-Side Reviewer Scoring Modal */}
      {selectedAppraisal && (
        <Modal
          open={reviewModalOpen}
          onClose={() => setReviewModalOpen(false)}
          title={`Evaluate Appraisal: ${(selectedAppraisal.userId as any)?.name}`}
          size="xl"
        >
          <form onSubmit={handleSubmitReview} className="space-y-6">
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
                {error}
              </div>
            )}

            {/* Appraisal Header Info */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="text-xs text-slate-500 font-medium">Appraisal Cycle</div>
                <div className="text-sm font-bold text-slate-900">
                  {(selectedAppraisal.cycleId as any)?.title} ({(selectedAppraisal.cycleId as any)?.academicYear})
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-xs text-slate-500 font-medium">Live Computed Score</div>
                  <div className="text-2xl font-black text-blue-600">{calculateLiveScore()}%</div>
                </div>
                <Badge variant={getAppraisalBadgeVariant(selectedAppraisal.status)}>
                  {APPRAISAL_STATUS_LABELS[selectedAppraisal.status] || selectedAppraisal.status}
                </Badge>
              </div>
            </div>

            {/* Criteria Evaluation List */}
            <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
              {(selectedAppraisal.cycleId as any)?.criteria?.map((criterion: AppraisalCriterion, idx: number) => {
                const selfEntry = selectedAppraisal.selfAssessment?.criteria?.find(
                  c => c.criterionId.toString() === criterion._id?.toString()
                );
                const reviewerEntry = reviewerScores[criterion._id!] || { score: 0, remarks: '' };

                return (
                  <div key={idx} className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <div>
                        <span className="text-xs font-extrabold text-slate-900">{criterion.name}</span>
                        {criterion.description && (
                          <p className="text-[11px] text-slate-500 mt-0.5">{criterion.description}</p>
                        )}
                      </div>
                      <div className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100">
                        Max: {criterion.maxScore} pts • Weight: {criterion.weight}%
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Left: Faculty Self-Rating */}
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-slate-700">Faculty Self-Rating</span>
                          <span className="text-xs font-black text-slate-900">
                            {selfEntry ? `${selfEntry.score} / ${criterion.maxScore}` : 'Not rated'}
                          </span>
                        </div>
                        <div className="text-xs text-slate-600 bg-white p-2 rounded-lg border border-slate-200 min-h-[44px]">
                          {selfEntry?.remarks ? selfEntry.remarks : <span className="text-slate-400 italic">No remarks provided</span>}
                        </div>
                      </div>

                      {/* Right: Reviewer Evaluation */}
                      <div className="p-3 rounded-xl bg-blue-50/40 border border-blue-200/70 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-blue-950">Reviewer Score</span>
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              min={0}
                              max={criterion.maxScore}
                              required
                              value={reviewerEntry.score}
                              onChange={e => handleScoreChange(criterion._id!, 'score', Number(e.target.value))}
                              className="w-16 px-2 py-1 text-xs font-bold text-blue-700 bg-white border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-center"
                            />
                            <span className="text-xs text-slate-500 font-semibold">/ {criterion.maxScore}</span>
                          </div>
                        </div>

                        <input
                          type="text"
                          placeholder="Reviewer remarks or specific feedback..."
                          value={reviewerEntry.remarks}
                          onChange={e => handleScoreChange(criterion._id!, 'remarks', e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs bg-white border border-blue-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Overall Remarks */}
            <FormField label="Comprehensive Reviewer Remarks & Recommendations" required>
              <textarea
                rows={3}
                required
                value={overallRemarks}
                onChange={e => setOverallRemarks(e.target.value)}
                placeholder="Provide cumulative performance assessment, commendations, and key developmental goals for the upcoming academic year..."
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
            </FormField>

            <div className="flex items-center justify-between pt-3 border-t border-slate-200">
              <div className="text-xs text-slate-500">
                Final Calculated Score: <strong className="text-blue-600 font-bold">{calculateLiveScore()}%</strong>
              </div>

              <div className="flex items-center gap-3">
                <Button type="button" variant="ghost" onClick={() => setReviewModalOpen(false)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  loading={submitting}
                  icon={<Send className="w-4 h-4" />}
                >
                  Submit Final Appraisal Review
                </Button>
              </div>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};