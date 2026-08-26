import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import {
  ArrowLeft,
  Download,
  Users,
  CheckCircle2,
  Clock,
  Award,
  Star,
  FileText,
  EyeOff,
  Edit3,
  Search,
  Filter,
  Check,
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { FormField } from '../../components/ui/FormField';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { EmptyState } from '../../components/ui/EmptyState';
import {
  getAssessmentResponses,
  gradeAssessmentResponse,
  downloadAssessmentCsv,
} from '../../api/assessments';
import type { Assessment, AssessmentResponse, AssessmentAnalytics } from '../../types';
import { CHART_COLORS } from '../../utils/constants';

export const AssessmentAnalyticsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [responses, setResponses] = useState<AssessmentResponse[]>([]);
  const [analytics, setAnalytics] = useState<AssessmentAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'submitted' | 'reviewed'>('all');

  // Grading Modal State
  const [gradingModalOpen, setGradingModalOpen] = useState(false);
  const [selectedResponse, setSelectedResponse] = useState<AssessmentResponse | null>(null);
  const [manualScores, setManualScores] = useState<Record<string, { score: number; feedback: string }>>({});
  const [reviewerNotes, setReviewerNotes] = useState('');
  const [savingGrade, setSavingGrade] = useState(false);

  const fetchAnalytics = () => {
    if (!id) return;
    setLoading(true);
    getAssessmentResponses(id)
      .then(res => {
        if (res.success && res.data) {
          setAssessment(res.data.assessment);
          setResponses(res.data.responses || []);
          setAnalytics(res.data.analytics);
        }
      })
      .catch(err => {
        alert(err.response?.data?.error || 'Failed to load assessment analytics');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAnalytics();
  }, [id]);

  const handleExportCsv = async () => {
    if (!id || !assessment) return;
    try {
      await downloadAssessmentCsv(id, assessment.title);
    } catch (err: any) {
      alert('Failed to export CSV results');
    }
  };

  const openGradingModal = (resp: AssessmentResponse) => {
    setSelectedResponse(resp);
    const scoreState: Record<string, { score: number; feedback: string }> = {};
    resp.answers.forEach(a => {
      scoreState[a.questionId.toString()] = {
        score: a.score ?? 0,
        feedback: a.feedback || '',
      };
    });
    setManualScores(scoreState);
    setReviewerNotes(resp.reviewerNotes || '');
    setGradingModalOpen(true);
  };

  const handleSaveGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !selectedResponse) return;
    setSavingGrade(true);

    try {
      const questionScores = Object.entries(manualScores).map(([qId, s]) => ({
        questionId: qId,
        score: Number(s.score) || 0,
        feedback: s.feedback,
      }));

      const facultyIdStr = typeof selectedResponse.facultyId === 'object'
        ? (selectedResponse.facultyId as any)._id
        : selectedResponse.facultyId;

      await gradeAssessmentResponse(id, facultyIdStr, {
        questionScores,
        reviewerNotes,
      });

      setGradingModalOpen(false);
      fetchAnalytics();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to save evaluation marks');
    } finally {
      setSavingGrade(false);
    }
  };

  if (loading) return <LoadingSpinner text="Computing assessment analytics & distributions..." />;
  if (!assessment || !analytics) return null;

  const isAnonymous = assessment.settings.isAnonymous;
  const isGraded = assessment.settings.isGraded;

  const filteredResponses = responses.filter(r => {
    const facultyName = (r.faculty as any)?.name || (r.facultyId as any)?.name || '';
    const facultyEmail = (r.faculty as any)?.email || (r.facultyId as any)?.email || '';
    const matchesSearch =
      facultyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      facultyEmail.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 pb-20 animate-fadeIn">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <Link
            to="/assessments"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 mb-1 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Assessments
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">{assessment.title}</h1>
            <Badge variant={assessment.status === 'published' ? 'success' : assessment.status === 'closed' ? 'danger' : 'muted'}>
              {assessment.status.toUpperCase()}
            </Badge>
            {isAnonymous && (
              <Badge variant="violet" className="flex items-center gap-1">
                <EyeOff className="w-3 h-3" /> Anonymous
              </Badge>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {assessment.topic} • Created by {(assessment.createdBy as any)?.name || 'Faculty Admin'} • Due: {assessment.settings.dueDate ? new Date(assessment.settings.dueDate).toLocaleDateString() : 'None'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            icon={<Download className="w-4 h-4" />}
          >
            Export CSV Report
          </Button>
        </div>
      </div>

      {/* Analytics KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 flex items-center gap-4 bg-white border border-slate-200">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">{analytics.totalResponses}</div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Submissions
            </div>
          </div>
        </Card>

        {isGraded ? (
          <>
            <Card className="p-4 flex items-center gap-4 bg-white border border-slate-200">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <div className="text-2xl font-black text-slate-900">{analytics.averageScore} pts</div>
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Mean Score ({analytics.averageScorePct}%)
                </div>
              </div>
            </Card>

            <Card className="p-4 flex items-center gap-4 bg-white border border-slate-200">
              <div className="w-12 h-12 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center font-bold">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <div className="text-2xl font-black text-slate-900">
                  {responses.filter(r => r.status === 'reviewed').length} / {analytics.totalResponses}
                </div>
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Evaluations Completed
                </div>
              </div>
            </Card>
          </>
        ) : (
          <Card className="p-4 flex items-center gap-4 bg-white border border-slate-200">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Star className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-black text-slate-900">Feedback Survey</div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Institutional Metric
              </div>
            </div>
          </Card>
        )}

        <Card className="p-4 flex items-center gap-4 bg-white border border-slate-200">
          <div className="w-12 h-12 rounded-xl bg-slate-50 text-slate-600 flex items-center justify-center font-bold">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">
              {responses.length > 0
                ? `${Math.round(
                    responses.reduce((sum, r) => sum + (r.timeTakenSeconds || 0), 0) /
                      (responses.length * 60)
                  )}m`
                : 'N/A'}
            </div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Avg Time Spent
            </div>
          </div>
        </Card>
      </div>

      {/* Visualizations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Score Distribution Chart */}
        {isGraded && (
          <Card className="lg:col-span-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Score Distribution Histogram</h3>
                <p className="text-xs text-slate-500">Cohort performance across percentage buckets</p>
              </div>
              <Badge variant="teal">Cohort Histogram</Badge>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={analytics.scoreDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="range" tick={{ fontSize: 11, fill: '#64748B' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748B' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '10px',
                    border: '1px solid #E2E8F0',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="count" fill="#2563EB" radius={[6, 6, 0, 0]}>
                  {analytics.scoreDistribution.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        )}

        {/* Question Performance Breakdown */}
        <Card className={isGraded ? 'lg:col-span-6' : 'lg:col-span-12'}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Question Performance & Accuracy</h3>
              <p className="text-xs text-slate-500">Correct answers / Average rating per question</p>
            </div>
            <Badge variant="info">Breakdown</Badge>
          </div>
          <div className="space-y-3 max-h-[260px] overflow-y-auto pr-1">
            {analytics.questionStats.map((qs, i) => (
              <div
                key={i}
                className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-800 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                      {qs.questionNumber}
                    </span>
                    <span className="text-xs font-bold text-slate-900 truncate">{qs.prompt}</span>
                  </div>
                  <span className="text-[10px] font-semibold text-slate-500 uppercase ml-7">
                    Type: {qs.type}
                  </span>
                </div>

                <div className="text-right shrink-0">
                  {qs.type === 'mcq' || qs.type === 'boolean' ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-extrabold text-slate-900">{qs.accuracyPct}%</span>
                      <div className="w-16 h-2 rounded-full bg-slate-200 overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full"
                          style={{ width: `${qs.accuracyPct}%` }}
                        />
                      </div>
                    </div>
                  ) : qs.type === 'rating' ? (
                    <div className="flex items-center gap-1 text-amber-600 font-bold text-xs">
                      <Star className="w-3.5 h-3.5 fill-amber-400" />
                      <span>{qs.averageRating} / 5.0</span>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-600 font-medium">
                      {qs.submittedResponsesCount} responses
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Submissions Roster & Evaluation Queue */}
      <Card className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Individual Submissions</h3>
            <p className="text-xs text-slate-500">
              {isAnonymous
                ? 'Anonymity mode active: Individual identities are masked with secure pseudonyms'
                : 'Faculty participant roster with real-time scoring and manual evaluation tools'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <input
                type="text"
                className="input text-xs pl-8 py-1.5 w-48"
                placeholder="Search respondent..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            </div>

            <select
              className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 font-medium"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as any)}
            >
              <option value="all">All Statuses</option>
              <option value="submitted">Needs Review</option>
              <option value="reviewed">Evaluated</option>
            </select>
          </div>
        </div>

        {filteredResponses.length === 0 ? (
          <EmptyState
            title="No responses found"
            description="No faculty submissions match your current filters."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider bg-slate-50/50">
                  <th className="py-3 px-4">Respondent</th>
                  <th className="py-3 px-4">Attempt</th>
                  <th className="py-3 px-4">Submitted At</th>
                  <th className="py-3 px-4">Time Taken</th>
                  {isGraded && <th className="py-3 px-4">Score</th>}
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredResponses.map(resp => {
                  const faculty = (resp.faculty as any) || (resp.facultyId as any);
                  const name = faculty?.name || 'Respondent';
                  const email = faculty?.email || '';

                  return (
                    <tr key={resp._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{name}</div>
                        {!isAnonymous && <div className="text-[11px] text-slate-500">{email}</div>}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-700">#{resp.attemptNumber}</td>
                      <td className="py-3 px-4 text-slate-600">
                        {resp.submittedAt ? new Date(resp.submittedAt).toLocaleString() : 'N/A'}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {resp.timeTakenSeconds ? `${Math.floor(resp.timeTakenSeconds / 60)}m ${resp.timeTakenSeconds % 60}s` : 'N/A'}
                      </td>
                      {isGraded && (
                        <td className="py-3 px-4 font-black text-slate-900">
                          {resp.totalScore} / {resp.maxScore}
                        </td>
                      )}
                      <td className="py-3 px-4">
                        <Badge variant={resp.status === 'reviewed' ? 'success' : 'warning'}>
                          {resp.status === 'reviewed' ? 'Evaluated' : 'Pending Review'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Button
                          variant={resp.status === 'submitted' ? 'primary' : 'outline'}
                          size="sm"
                          onClick={() => openGradingModal(resp)}
                          icon={<Edit3 className="w-3.5 h-3.5" />}
                        >
                          {resp.status === 'submitted' ? 'Review & Grade' : 'View / Edit Marks'}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Manual Grading & Annotation Modal */}
      {gradingModalOpen && selectedResponse && (
        <Modal
          open={gradingModalOpen}
          onClose={() => setGradingModalOpen(false)}
          title={`Evaluate Response: ${(selectedResponse.faculty as any)?.name || 'Respondent'}`}
          size="lg"
        >
          <form onSubmit={handleSaveGrade} className="space-y-5">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 flex justify-between">
              <div>
                <span className="font-bold">Attempt:</span> #{selectedResponse.attemptNumber}
              </div>
              <div>
                <span className="font-bold">Submitted:</span>{' '}
                {selectedResponse.submittedAt ? new Date(selectedResponse.submittedAt).toLocaleString() : 'N/A'}
              </div>
            </div>

            <div className="space-y-4 max-h-[420px] overflow-y-auto pr-1">
              {assessment.questions.map((q, idx) => {
                const qIdStr = q._id?.toString() || '';
                const ansObj = selectedResponse.answers.find(a => a.questionId.toString() === qIdStr);
                const scoreData = manualScores[qIdStr] || { score: ansObj?.score || 0, feedback: ansObj?.feedback || '' };

                return (
                  <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-slate-800 text-white font-bold text-[10px] flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <span className="font-bold text-xs text-slate-900">{q.prompt}</span>
                      </div>
                      <Badge variant="teal">{q.type.toUpperCase()}</Badge>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                      <span className="text-slate-500 font-medium">Participant Answer: </span>
                      <span className="font-mono font-semibold text-slate-900">
                        {String(ansObj?.answer !== undefined ? ansObj.answer : 'No answer')}
                      </span>
                    </div>

                    {q.rubricGuide && (
                      <div className="text-[11px] text-slate-500 italic">
                        <span className="font-bold not-italic">Rubric: </span>
                        {q.rubricGuide}
                      </div>
                    )}

                    {isGraded && (
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-2 border-t border-slate-100">
                        <div className="sm:col-span-3">
                          <label className="text-[11px] font-bold text-slate-700 block mb-1">
                            Score (Max: {q.points ?? 1})
                          </label>
                          <input
                            type="number"
                            min={0}
                            max={q.points ?? 10}
                            step="0.5"
                            className="input py-1 text-xs font-bold"
                            value={scoreData.score}
                            onChange={e =>
                              setManualScores(prev => ({
                                ...prev,
                                [qIdStr]: { ...prev[qIdStr], score: Number(e.target.value) },
                              }))
                            }
                          />
                        </div>
                        <div className="sm:col-span-9">
                          <label className="text-[11px] font-bold text-slate-700 block mb-1">
                            Question Annotation / Feedback
                          </label>
                          <input
                            type="text"
                            className="input py-1 text-xs"
                            placeholder="Optional reviewer notes on this answer..."
                            value={scoreData.feedback}
                            onChange={e =>
                              setManualScores(prev => ({
                                ...prev,
                                [qIdStr]: { ...prev[qIdStr], feedback: e.target.value },
                              }))
                            }
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <FormField label="Overall Evaluator Remarks">
              <textarea
                rows={2}
                className="input text-xs"
                placeholder="Overarching feedback visible to the faculty member..."
                value={reviewerNotes}
                onChange={e => setReviewerNotes(e.target.value)}
              />
            </FormField>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
              <Button type="button" variant="secondary" onClick={() => setGradingModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" loading={savingGrade} icon={<Check className="w-4 h-4" />}>
                Finalize & Save Evaluation
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
