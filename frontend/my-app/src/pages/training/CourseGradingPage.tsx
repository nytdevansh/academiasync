import React, { useEffect, useState } from 'react';
import {
  CheckSquare,
  Award,
  Clock,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  Filter,
  ArrowRight,
  BookOpen,
  Lock,
  Edit3,
  Send,
  Building2,
  Calendar,
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { getPrograms } from '../../api/training';
import {
  getProgramSubmissions,
  getCourseAssessment,
  gradeSubmission,
  type CourseAssessmentSubmission,
  type CourseAssessment,
} from '../../api/lms';
import { useAuth } from '../../context/AuthContext';

export const CourseGradingPage: React.FC = () => {
  const { user } = useAuth();
  const [programs, setPrograms] = useState<any[]>([]);
  const [selectedProgramId, setSelectedProgramId] = useState<string>('');
  const [submissions, setSubmissions] = useState<CourseAssessmentSubmission[]>([]);
  const [assessment, setAssessment] = useState<CourseAssessment | null>(null);
  const [loading, setLoading] = useState(true);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);

  // Active grading submission
  const [activeSub, setActiveSub] = useState<CourseAssessmentSubmission | null>(null);
  const [gradedAnswers, setGradedAnswers] = useState<Record<number, { score: number; feedback: string }>>({});
  const [submittingGrade, setSubmittingGrade] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'submitted' | 'graded'>('submitted');

  // Load programs with assessments
  useEffect(() => {
    getPrograms()
      .then((res: any) => {
        if (res.success && res.data) {
          setPrograms(res.data);
          if (res.data.length > 0) {
            setSelectedProgramId(res.data[0]._id);
          }
        }
      })
      .catch((err: any) => console.error('Failed to load courses:', err))
      .finally(() => setLoading(false));
  }, []);

  // Load submissions & assessment for selected program
  const loadProgramSubmissions = async (progId: string) => {
    if (!progId) return;
    setSubmissionsLoading(true);
    setActiveSub(null);
    try {
      const [subsRes, assessRes] = await Promise.all([
        getProgramSubmissions(progId).catch(() => ({ success: false, data: [] })),
        getCourseAssessment(progId).catch(() => ({ success: false, data: null })),
      ]);

      if (subsRes.success && subsRes.data) setSubmissions(subsRes.data);
      if (assessRes.success && assessRes.data) setAssessment(assessRes.data);
    } catch (err) {
      console.error('Failed to load submissions:', err);
    } finally {
      setSubmissionsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedProgramId) {
      loadProgramSubmissions(selectedProgramId);
    }
  }, [selectedProgramId]);

  // When active submission changes, populate gradedAnswers
  useEffect(() => {
    if (activeSub && assessment) {
      const initial: Record<number, { score: number; feedback: string }> = {};
      assessment.questions.forEach((q, idx) => {
        const existingAns = activeSub.answers?.find((a) => a.questionIndex === idx);
        initial[idx] = {
          score: existingAns?.score ?? (q.type === 'mcq' && existingAns?.selectedOption === q.correctAnswer ? (q.maxScore ?? 10) : 0),
          feedback: existingAns?.feedback || '',
        };
      });
      setGradedAnswers(initial);
    }
  }, [activeSub, assessment]);

  const handleScoreChange = (qIndex: number, score: number, maxScore: number) => {
    const clamped = Math.max(0, Math.min(maxScore, isNaN(score) ? 0 : score));
    setGradedAnswers((prev) => ({
      ...prev,
      [qIndex]: {
        ...prev[qIndex],
        score: clamped,
      },
    }));
  };

  const handleFeedbackChange = (qIndex: number, feedback: string) => {
    setGradedAnswers((prev) => ({
      ...prev,
      [qIndex]: {
        ...prev[qIndex],
        feedback,
      },
    }));
  };

  // Real-time calculation of total & percentage score
  const calculateTotal = () => {
    if (!assessment) return { totalScore: 0, maxPossible: 0, percentage: 0, passed: false };
    let total = 0;
    let maxPossible = 0;

    assessment.questions.forEach((q, idx) => {
      maxPossible += q.maxScore || 10;
      total += gradedAnswers[idx]?.score ?? 0;
    });

    const percentage = maxPossible > 0 ? Math.round((total / maxPossible) * 100) : 0;
    const passingThreshold = assessment.passingScore || 60;
    const passed = percentage >= passingThreshold;

    return { totalScore: total, maxPossible, percentage, passed };
  };

  const { totalScore, maxPossible, percentage, passed } = calculateTotal();

  const handleFinalizeGrade = async () => {
    if (!selectedProgramId || !activeSub || !assessment) return;
    setSubmittingGrade(true);
    try {
      const mergedAnswers = assessment.questions.map((q, idx) => {
        const orig = activeSub.answers?.find((a) => a.questionIndex === idx);
        return {
          questionIndex: idx,
          prompt: q.prompt,
          type: q.type,
          selectedOption: orig?.selectedOption,
          answerText: orig?.answerText,
          score: gradedAnswers[idx]?.score ?? 0,
          feedback: gradedAnswers[idx]?.feedback ?? '',
          isCorrect: q.type === 'mcq' ? orig?.selectedOption === q.correctAnswer : (gradedAnswers[idx]?.score ?? 0) >= (q.maxScore || 10) / 2,
        };
      });

      await gradeSubmission(selectedProgramId, activeSub._id!, {
        answers: mergedAnswers,
        totalScore,
        passed,
      });

      await loadProgramSubmissions(selectedProgramId);
      setActiveSub(null);
    } catch (err: any) {
      alert(err.response?.data?.error || err.message || 'Failed to submit grade');
    } finally {
      setSubmittingGrade(false);
    }
  };

  if (loading) return <LoadingSpinner text="Loading instructor evaluation workspace..." />;

  const filteredSubs = submissions.filter((s) => {
    if (statusFilter === 'all') return true;
    return s.status === statusFilter;
  });

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <CheckSquare className="w-5 h-5 text-blue-600" />
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Instructor Course Evaluation Workspace
            </h1>
          </div>
          <p className="text-xs font-medium text-slate-500">
            Review, evaluate subjective answers, and finalize course certifications for department faculty
          </p>
        </div>

        {/* Course Selector Dropdown */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-slate-600 shrink-0">Select Course:</label>
          <select
            value={selectedProgramId}
            onChange={(e) => setSelectedProgramId(e.target.value)}
            className="text-xs font-medium bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 max-w-xs"
          >
            {programs.map((p) => (
              <option key={p._id} value={p._id}>
                {p.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {submissionsLoading ? (
        <LoadingSpinner text="Retrieving assessment submissions..." />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Left Column: Submissions Queue */}
          <div className="space-y-3">
            <Card className="p-4 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Submissions Queue ({filteredSubs.length})
                </span>

                {/* Filter Pills */}
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-[10px]">
                  <button
                    onClick={() => setStatusFilter('submitted')}
                    className={`px-2 py-0.5 rounded font-bold transition-all ${
                      statusFilter === 'submitted' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-500'
                    }`}
                  >
                    Pending
                  </button>
                  <button
                    onClick={() => setStatusFilter('graded')}
                    className={`px-2 py-0.5 rounded font-bold transition-all ${
                      statusFilter === 'graded' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-500'
                    }`}
                  >
                    Graded
                  </button>
                  <button
                    onClick={() => setStatusFilter('all')}
                    className={`px-2 py-0.5 rounded font-bold transition-all ${
                      statusFilter === 'all' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-500'
                    }`}
                  >
                    All
                  </button>
                </div>
              </div>

              {filteredSubs.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400 space-y-1">
                  <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-400" />
                  <p className="font-semibold text-slate-700">All submissions graded!</p>
                  <p>No submissions awaiting evaluation in this category.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredSubs.map((sub) => {
                    const faculty = sub.userId as any;
                    const isSelected = activeSub?._id === sub._id;
                    const isPending = sub.status === 'submitted';

                    return (
                      <div
                        key={sub._id}
                        onClick={() => setActiveSub(sub)}
                        className={`p-3 rounded-xl border text-xs cursor-pointer transition-all space-y-1.5 ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50/70 text-blue-900 shadow-xs'
                            : 'border-slate-200/80 bg-white hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900">{faculty?.name || 'Faculty Member'}</span>
                          <Badge variant={isPending ? 'warning' : sub.passed ? 'success' : 'danger'}>
                            {isPending ? 'Needs Grading' : sub.passed ? `${sub.percentageScore}% Passed` : `${sub.percentageScore}% Failed`}
                          </Badge>
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center justify-between">
                          <span>{faculty?.department?.name || 'Academic Dept'}</span>
                          <span>{new Date(sub.submittedAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </div>

          {/* Right Column: Grading Interface */}
          <div className="lg:col-span-2">
            {activeSub && assessment ? (
              <Card className="p-6 space-y-6">
                {/* Header of Active Submission */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div>
                    <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">
                      Evaluating Submission
                    </span>
                    <h2 className="text-base font-bold text-slate-900 mt-0.5">
                      {(activeSub.userId as any)?.name} ({(activeSub.userId as any)?.email})
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Submitted: {new Date(activeSub.submittedAt).toLocaleString()}
                    </p>
                  </div>

                  {/* Live Score Counter Badge */}
                  <div className="text-right p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-0.5">
                    <div className="text-[10px] font-bold uppercase text-slate-400">Total Live Score</div>
                    <div className="text-xl font-extrabold text-slate-900 font-mono">
                      {totalScore} / {maxPossible} pts ({percentage}%)
                    </div>
                    <Badge variant={passed ? 'success' : 'danger'}>
                      {passed ? '✓ Passing Threshold Met' : '✗ Below Passing Score'}
                    </Badge>
                  </div>
                </div>

                {/* Per-Question Grading Workspace */}
                <div className="space-y-6">
                  {assessment.questions.map((q, idx) => {
                    const studentAns = activeSub.answers?.find((a) => a.questionIndex === idx);
                    const isMcq = q.type === 'mcq';
                    const isCorrectMcq = isMcq && studentAns?.selectedOption === q.correctAnswer;

                    return (
                      <div
                        key={q._id || idx}
                        className={`p-4 rounded-xl border space-y-3 ${
                          isMcq ? 'bg-slate-50/50 border-slate-200' : 'bg-white border-blue-200/80 shadow-2xs'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-900">
                                Question {idx + 1}. {q.prompt}
                              </span>
                              {isMcq ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 bg-slate-200 text-slate-700 rounded-md">
                                  <Lock className="w-3 h-3 text-slate-500" />
                                  Auto-Graded MCQ
                                </span>
                              ) : (
                                <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-100 text-blue-800 rounded-md">
                                  Subjective / Manual Review
                                </span>
                              )}
                            </div>
                            {q.rubricGuide && (
                              <p className="text-[11px] text-slate-500 italic">Rubric: {q.rubricGuide}</p>
                            )}
                          </div>
                          <span className="text-xs font-bold text-slate-500 shrink-0">
                            Max: {q.maxScore || 10} pts
                          </span>
                        </div>

                        {/* Faculty's Answer Display */}
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                          <span className="text-[10px] font-bold uppercase text-slate-400">Faculty's Submitted Response:</span>
                          {isMcq ? (
                            <div className="font-semibold text-slate-900">
                              Option Selected: {studentAns?.selectedOption != null ? q.options?.[studentAns.selectedOption] : 'None Selected'}
                              {isCorrectMcq ? (
                                <span className="text-emerald-600 font-bold ml-2">✓ Correct Answer (+{q.maxScore} pts)</span>
                              ) : (
                                <span className="text-rose-600 font-bold ml-2">✗ Incorrect Answer (0 pts)</span>
                              )}
                            </div>
                          ) : (
                            <p className="text-slate-800 whitespace-pre-wrap leading-relaxed">
                              {studentAns?.answerText || 'No textual response provided.'}
                            </p>
                          )}
                        </div>

                        {/* Evaluator Score & Feedback Inputs */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 items-center">
                          {/* Score Input: Locked for MCQ, Editable for Subjective */}
                          <div>
                            <label className="text-[11px] font-bold text-slate-600 block mb-1">
                              Awarded Points (0 – {q.maxScore || 10}):
                            </label>
                            {isMcq ? (
                              <input
                                type="number"
                                disabled
                                value={isCorrectMcq ? (q.maxScore || 10) : 0}
                                className="w-full px-3 py-2 bg-slate-100 text-slate-500 border border-slate-200 rounded-xl text-xs font-bold cursor-not-allowed"
                              />
                            ) : (
                              <input
                                type="number"
                                min={0}
                                max={q.maxScore || 10}
                                value={gradedAnswers[idx]?.score ?? 0}
                                onChange={(e) =>
                                  handleScoreChange(idx, parseInt(e.target.value, 10), q.maxScore || 10)
                                }
                                className="w-full px-3 py-2 bg-white text-slate-900 border border-blue-300 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            )}
                          </div>

                          {/* Grader Feedback Textarea */}
                          <div className="sm:col-span-2">
                            <label className="text-[11px] font-bold text-slate-600 block mb-1">
                              Evaluator Feedback / Rubric Notes:
                            </label>
                            <input
                              type="text"
                              value={gradedAnswers[idx]?.feedback ?? ''}
                              onChange={(e) => handleFeedbackChange(idx, e.target.value)}
                              placeholder="e.g. Well articulated pedagogical rationale..."
                              className="w-full px-3 py-2 bg-white text-slate-900 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Finalize Action Footer */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-slate-100">
                  <div className="text-xs text-slate-500">
                    Calculated Result:{' '}
                    <strong className={passed ? 'text-emerald-700 font-extrabold' : 'text-rose-700 font-extrabold'}>
                      {percentage}% ({passed ? 'PASS & ISSUE CERTIFICATE' : 'FAIL & REQUIRE RETAKE'})
                    </strong>
                  </div>

                  <Button
                    variant="primary"
                    size="md"
                    loading={submittingGrade}
                    onClick={handleFinalizeGrade}
                    className="flex items-center gap-2"
                  >
                    <Award className="w-4 h-4" />
                    <span>Finalize Grade &amp; Update Record</span>
                  </Button>
                </div>
              </Card>
            ) : (
              <Card className="p-12 text-center text-slate-400 space-y-2">
                <BookOpen className="w-10 h-10 mx-auto text-slate-300" />
                <h3 className="font-bold text-sm text-slate-700">Select a submission from the left queue</h3>
                <p className="text-xs">
                  Review faculty responses, assign points for subjective questions, and finalize course certifications.
                </p>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
