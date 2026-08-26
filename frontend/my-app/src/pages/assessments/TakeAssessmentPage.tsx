import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Send,
  HelpCircle,
  Star,
  Award,
  ChevronRight,
  ShieldAlert,
  RotateCcw,
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { ProgressBar } from '../../components/ui/ProgressBar';
import {
  getAssessmentById,
  startAssessment,
  submitAssessmentResponse,
} from '../../api/assessments';
import type { Assessment, AssessmentResponse } from '../../types';

export const TakeAssessmentPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Attempt tracking state
  const [startedAt, setStartedAt] = useState<string | null>(null);
  const [attemptNumber, setAttemptNumber] = useState(1);
  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(null);
  const [submittedResult, setSubmittedResult] = useState<AssessmentResponse | null>(null);

  // Answers Map: questionId -> answer
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const timerRef = useRef<any>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);

    getAssessmentById(id)
      .then(res => {
        if (res.success && res.data) {
          const assess = res.data;
          setAssessment(assess);

          // Check if faculty already completed this assessment
          if (assess.myResponses && assess.myResponses.length > 0) {
            const latest = assess.myResponses[0];
            // If already submitted and retakes are not allowed, show result directly
            if (!assess.settings.allowRetake || assess.status === 'closed') {
              setSubmittedResult(latest);
              setLoading(false);
              return;
            }
          }

          // Initialize attempt with server timestamp
          startAssessment(id)
            .then(startRes => {
              if (startRes.success && startRes.data) {
                setStartedAt(startRes.data.startedAt);
                setAttemptNumber(startRes.data.attemptNumber);
                if (startRes.data.timeLimitMinutes) {
                  setSecondsRemaining(startRes.data.timeLimitMinutes * 60);
                }
              }
            })
            .catch(err => {
              console.warn('Could not initialize server attempt:', err);
              setStartedAt(new Date().toISOString());
              if (assess.settings.timeLimitMinutes) {
                setSecondsRemaining(assess.settings.timeLimitMinutes * 60);
              }
            });
        }
      })
      .catch(err => {
        alert(err.response?.data?.error || 'Failed to load assessment');
        navigate('/assessments');
      })
      .finally(() => setLoading(false));

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [id, navigate]);

  // Live Timer Countdown
  useEffect(() => {
    if (secondsRemaining === null || secondsRemaining <= 0 || submittedResult) return;

    timerRef.current = setInterval(() => {
      setSecondsRemaining(prev => {
        if (prev === null) return null;
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [secondsRemaining, submittedResult]);

  const handleAnswerChange = (questionId: string, value: any) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const handleAutoSubmit = () => {
    alert('Time limit reached! Your assessment will now be submitted automatically.');
    performSubmission();
  };

  const performSubmission = async () => {
    if (!id || !assessment) return;
    setSubmitting(true);

    try {
      const payloadAnswers = assessment.questions.map(q => ({
        questionId: q._id!,
        answer: answers[q._id!] !== undefined ? answers[q._id!] : null,
      }));

      const res = await submitAssessmentResponse(id, {
        answers: payloadAnswers,
        startedAt: startedAt || new Date().toISOString(),
        attemptNumber,
      });

      if (res.success && res.data) {
        setSubmittedResult(res.data);
      }
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to submit assessment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assessment) return;

    const answeredCount = Object.keys(answers).filter(k => answers[k] !== undefined && answers[k] !== '').length;
    const totalCount = assessment.questions.length;

    if (answeredCount < totalCount) {
      if (!confirm(`You have answered ${answeredCount} of ${totalCount} questions. Submit anyway?`)) {
        return;
      }
    } else {
      if (!confirm('Are you ready to submit your final answers?')) {
        return;
      }
    }

    performSubmission();
  };

  if (loading) return <LoadingSpinner text="Preparing assessment session..." />;
  if (!assessment) return null;

  // ── Render Results View ──────────────────────────────────────────────────────
  if (submittedResult) {
    const isGraded = assessment.settings.isGraded;
    const pct = submittedResult.maxScore > 0
      ? Math.round((submittedResult.totalScore / submittedResult.maxScore) * 100)
      : 0;

    return (
      <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn pb-12">
        {/* Header Back Link */}
        <div className="flex items-center justify-between">
          <Link
            to="/assessments"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-blue-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Assessments
          </Link>
          <Badge variant={submittedResult.status === 'reviewed' ? 'success' : 'warning'}>
            Status: {submittedResult.status === 'reviewed' ? 'Evaluated / Completed' : 'Under Review'}
          </Badge>
        </div>

        {/* Results Banner */}
        <Card className="overflow-hidden border-2 border-slate-200">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="inline-block px-2.5 py-0.5 rounded-full bg-white/20 text-[11px] font-bold uppercase tracking-wider mb-2">
                  Submission Summary
                </span>
                <h1 className="text-2xl font-extrabold">{assessment.title}</h1>
                <p className="text-xs text-blue-100 mt-1">{assessment.topic}</p>
              </div>

              {isGraded ? (
                <div className="text-right bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/20">
                  <div className="text-3xl font-black">{submittedResult.totalScore} / {submittedResult.maxScore}</div>
                  <div className="text-xs font-bold text-blue-100 uppercase tracking-wider mt-0.5">
                    Score ({pct}%)
                  </div>
                </div>
              ) : (
                <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/20 text-center">
                  <CheckCircle2 className="w-8 h-8 text-emerald-300 mx-auto mb-1" />
                  <div className="text-xs font-bold uppercase tracking-wider">Survey Recorded</div>
                </div>
              )}
            </div>
          </div>

          <div className="p-6 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-600">
            <div>
              <span className="font-semibold text-slate-900">Submitted: </span>
              {submittedResult.submittedAt ? new Date(submittedResult.submittedAt).toLocaleString() : 'Just now'}
            </div>
            <div>
              <span className="font-semibold text-slate-900">Time Taken: </span>
              {submittedResult.timeTakenSeconds ? `${Math.floor(submittedResult.timeTakenSeconds / 60)}m ${submittedResult.timeTakenSeconds % 60}s` : 'N/A'}
            </div>
            <div>
              <span className="font-semibold text-slate-900">Attempt: </span>
              #{submittedResult.attemptNumber}
            </div>
          </div>
        </Card>

        {/* Reviewer Notes if available */}
        {submittedResult.reviewerNotes && (
          <Card className="border-l-4 border-l-blue-600 bg-blue-50/50">
            <h4 className="text-xs font-bold uppercase tracking-wider text-blue-900 mb-1">
              Evaluator Feedback & Recommendations
            </h4>
            <p className="text-sm text-slate-800 italic">"{submittedResult.reviewerNotes}"</p>
          </Card>
        )}

        {/* Question-by-Question Review */}
        <div className="space-y-4">
          <h3 className="font-bold text-slate-900 text-lg">Detailed Question Breakdown</h3>

          {assessment.questions.map((q, idx) => {
            const userAnsObj = submittedResult.answers.find(
              a => a.questionId?.toString() === q._id?.toString()
            );
            const userAns = userAnsObj?.answer;
            const score = userAnsObj?.score ?? 0;
            const points = q.points ?? 1;

            return (
              <Card key={idx} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-slate-800 text-white font-bold text-xs flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span className="text-xs font-bold text-slate-500 uppercase">{q.type}</span>
                  </div>
                  {isGraded && q.type !== 'rating' && (
                    <Badge variant={score === points ? 'success' : score > 0 ? 'warning' : 'danger'}>
                      Points: {score} / {points}
                    </Badge>
                  )}
                </div>

                <div className="text-sm font-semibold text-slate-900">{q.prompt}</div>

                {/* Question Types Response Rendering */}
                {q.type === 'mcq' && (
                  <div className="space-y-1.5 pl-2">
                    {q.options?.map((opt, optIdx) => {
                      const isSelected = Number(userAns) === optIdx;
                      const isCorrect = q.correctAnswer !== undefined && Number(q.correctAnswer) === optIdx;

                      let optClasses = 'border-slate-200 bg-white text-slate-700';
                      if (isCorrect) {
                        optClasses = 'border-emerald-300 bg-emerald-50 text-emerald-900 font-semibold';
                      } else if (isSelected && !isCorrect) {
                        optClasses = 'border-rose-300 bg-rose-50 text-rose-900 line-through';
                      }

                      return (
                        <div
                          key={optIdx}
                          className={`p-2.5 rounded-lg border text-xs flex items-center justify-between ${optClasses}`}
                        >
                          <span>{opt}</span>
                          {isSelected && <span className="font-bold text-[10px] uppercase">(Your Pick)</span>}
                          {isCorrect && <span className="font-bold text-emerald-700 text-[10px] uppercase">(Correct Answer)</span>}
                        </div>
                      );
                    })}
                  </div>
                )}

                {q.type === 'boolean' && (
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs flex items-center justify-between">
                    <div>
                      <span className="text-slate-500">Your Answer: </span>
                      <span className="font-bold">{userAns === true ? 'True' : userAns === false ? 'False' : 'Unanswered'}</span>
                    </div>
                    {q.correctAnswer !== undefined && (
                      <div className="text-emerald-700 font-bold">
                        Correct Answer: {q.correctAnswer ? 'True' : 'False'}
                      </div>
                    )}
                  </div>
                )}

                {q.type === 'rating' && (
                  <div className="p-3 rounded-lg bg-amber-50/50 border border-amber-200/60 text-xs">
                    <span className="text-slate-500">Your Rating: </span>
                    <span className="font-black text-amber-900 text-sm ml-1">{userAns || 'N/A'} / 5</span>
                  </div>
                )}

                {q.type === 'text' && (
                  <div className="space-y-2">
                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs font-mono whitespace-pre-wrap">
                      {userAns || 'No response provided.'}
                    </div>
                    {userAnsObj?.feedback && (
                      <div className="text-xs text-blue-800 bg-blue-50 p-2 rounded border border-blue-200">
                        <span className="font-bold">Reviewer Annotation: </span>
                        {userAnsObj.feedback}
                      </div>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>

        {/* Retake Action if enabled */}
        {assessment.settings.allowRetake && assessment.status === 'published' && (
          <div className="text-center pt-4">
            <Button
              variant="outline"
              icon={<RotateCcw className="w-4 h-4" />}
              onClick={() => {
                setSubmittedResult(null);
                setAnswers({});
                setStartedAt(new Date().toISOString());
                if (assessment.settings.timeLimitMinutes) {
                  setSecondsRemaining(assessment.settings.timeLimitMinutes * 60);
                }
              }}
            >
              Take Another Attempt
            </Button>
          </div>
        )}
      </div>
    );
  }

  // ── Render Active Taking Interface ───────────────────────────────────────────
  const answeredCount = Object.keys(answers).filter(k => answers[k] !== undefined && answers[k] !== '').length;
  const totalQuestions = assessment.questions.length;
  const progressPercent = Math.round((answeredCount / totalQuestions) * 100);

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 animate-fadeIn">
      {/* Sticky Header / Timer */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-slate-200 shadow-md flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-extrabold text-slate-900 truncate max-w-md">{assessment.title}</h1>
          <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
            <span>{assessment.topic}</span>
            <span>•</span>
            <span>Attempt #{attemptNumber}</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {secondsRemaining !== null && (
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-mono text-sm font-bold border transition-colors ${
                secondsRemaining < 120
                  ? 'bg-rose-50 border-rose-300 text-rose-700 animate-pulse'
                  : 'bg-blue-50 border-blue-200 text-blue-700'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>{formatTimer(secondsRemaining)}</span>
            </div>
          )}

          <Button
            variant="primary"
            size="sm"
            onClick={handleManualSubmit}
            loading={submitting}
            icon={<Send className="w-3.5 h-3.5" />}
          >
            Submit Assessment
          </Button>
        </div>

        <div className="w-full pt-1">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 mb-1">
            <span>Progress: {answeredCount} of {totalQuestions} Answered</span>
            <span>{progressPercent}%</span>
          </div>
          <ProgressBar value={progressPercent} variant={progressPercent === 100 ? 'teal' : 'blue'} />
        </div>
      </div>

      {/* Questions Form */}
      <form onSubmit={handleManualSubmit} className="space-y-6">
        {assessment.questions.map((q, idx) => {
          const qId = q._id || String(idx);
          const currentAns = answers[qId];

          return (
            <Card
              key={qId}
              className={`p-6 border-2 transition-all ${
                currentAns !== undefined && currentAns !== ''
                  ? 'border-blue-200 bg-white shadow-2xs'
                  : 'border-slate-200 bg-slate-50/50'
              }`}
            >
              {/* Question Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg bg-blue-600 text-white font-extrabold text-xs flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    {q.type === 'mcq'
                      ? 'Multiple Choice'
                      : q.type === 'boolean'
                      ? 'True / False'
                      : q.type === 'rating'
                      ? 'Satisfaction / Feedback Rating'
                      : 'Free-Text Analysis'}
                  </span>
                </div>
                {assessment.settings.isGraded && q.points && (
                  <Badge variant="teal">{q.points} {q.points === 1 ? 'Point' : 'Points'}</Badge>
                )}
              </div>

              {/* Question Text */}
              <p className="text-base font-semibold text-slate-900 mb-4">{q.prompt}</p>

              {/* Input Modes */}
              {q.type === 'mcq' && (
                <div className="space-y-2.5">
                  {q.options?.map((opt, optIdx) => (
                    <label
                      key={optIdx}
                      className={`flex items-center gap-3 p-3 rounded-xl border text-sm cursor-pointer transition-all ${
                        Number(currentAns) === optIdx
                          ? 'border-blue-600 bg-blue-50/60 font-semibold text-blue-900 shadow-2xs'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name={`q_${qId}`}
                        checked={Number(currentAns) === optIdx}
                        onChange={() => handleAnswerChange(qId, optIdx)}
                        className="text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                      <span>{opt}</span>
                    </label>
                  ))}
                </div>
              )}

              {q.type === 'boolean' && (
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => handleAnswerChange(qId, true)}
                    className={`py-3 px-4 rounded-xl border text-sm font-bold transition-all cursor-pointer ${
                      currentAns === true
                        ? 'border-blue-600 bg-blue-600 text-white shadow-md'
                        : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    True
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAnswerChange(qId, false)}
                    className={`py-3 px-4 rounded-xl border text-sm font-bold transition-all cursor-pointer ${
                      currentAns === false
                        ? 'border-blue-600 bg-blue-600 text-white shadow-md'
                        : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    False
                  </button>
                </div>
              )}

              {q.type === 'rating' && (
                <div className="space-y-2">
                  <div className="grid grid-cols-5 gap-2">
                    {[1, 2, 3, 4, 5].map(starVal => (
                      <button
                        key={starVal}
                        type="button"
                        onClick={() => handleAnswerChange(qId, starVal)}
                        className={`py-3 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                          Number(currentAns) === starVal
                            ? 'border-amber-500 bg-amber-500 text-white shadow-md'
                            : 'border-slate-200 bg-white text-slate-700 hover:bg-amber-50 hover:border-amber-300'
                        }`}
                      >
                        <Star className={`w-5 h-5 ${Number(currentAns) === starVal ? 'fill-white' : 'text-amber-400'}`} />
                        <span className="text-xs font-extrabold">{starVal}</span>
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 px-1">
                    <span>1 - Strongly Disagree / Poor</span>
                    <span>5 - Strongly Agree / Outstanding</span>
                  </div>
                </div>
              )}

              {q.type === 'text' && (
                <div className="space-y-1.5">
                  <textarea
                    rows={4}
                    className="input font-normal text-sm"
                    placeholder="Provide your comprehensive evaluation or response here..."
                    value={currentAns || ''}
                    onChange={e => handleAnswerChange(qId, e.target.value)}
                  />
                  {q.rubricGuide && (
                    <div className="text-[11px] text-slate-500 italic">
                      <span className="font-bold not-italic text-slate-600">Guideline: </span>
                      {q.rubricGuide}
                    </div>
                  )}
                </div>
              )}
            </Card>
          );
        })}

        {/* Bottom Submit Bar */}
        <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="text-xs text-slate-500">
            {answeredCount === totalQuestions ? (
              <span className="text-emerald-600 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> All questions completed
              </span>
            ) : (
              <span>{totalQuestions - answeredCount} unanswered questions remaining</span>
            )}
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={submitting}
            icon={<Send className="w-4 h-4" />}
          >
            Submit All Answers
          </Button>
        </div>
      </form>
    </div>
  );
};
