import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  BookOpen,
  CheckCircle2,
  PlayCircle,
  FileText,
  ExternalLink,
  HelpCircle,
  Clock,
  Award,
  ShieldCheck,
  AlertTriangle,
  ArrowLeft,
  Sparkles,
  ChevronRight,
  Send,
  CalendarCheck,
  CheckSquare,
  RefreshCw,
  Copy,
  Check,
  History,
  AlertCircle,
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { Modal } from '../../components/ui/Modal';
import { getProgramById } from '../../api/training';
import {
  getCourseContent,
  toggleModuleProgress,
  getMyAttendance,
  getCourseAssessment,
  submitCourseAssessment,
  getMySubmission,
  getMyCourseResults,
  type CourseContent,
  type CourseModule,
  type AttendanceRecord,
  type CourseAssessment,
  type CourseAssessmentSubmission,
  type CourseAttemptResult,
} from '../../api/lms';
import { CertificateModal } from '../../components/certificates/CertificateModal';
import { getServerNow } from '../../api/axiosInstance';
import { useAuth } from '../../context/AuthContext';

export const CourseLearningPage: React.FC = () => {
  const { id: programId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<'modules' | 'attendance' | 'assessment'>('modules');
  const [loading, setLoading] = useState(true);
  const [program, setProgram] = useState<any>(null);
  const [content, setContent] = useState<CourseContent | null>(null);
  const [completedModules, setCompletedModules] = useState<string[]>([]);
  const [selectedModule, setSelectedModule] = useState<CourseModule | null>(null);
  const [attendance, setAttendance] = useState<AttendanceRecord | null>(null);
  const [assessment, setAssessment] = useState<CourseAssessment | null>(null);
  const [submission, setSubmission] = useState<CourseAssessmentSubmission | null>(null);

  // Multi-Attempt & Certification State
  const [attemptHistory, setAttemptHistory] = useState<CourseAttemptResult[]>([]);
  const [enrollment, setEnrollment] = useState<any>(null);
  const [selectedCert, setSelectedCert] = useState<any>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [refreshingStatus, setRefreshingStatus] = useState(false);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
  const [nowTimestamp, setNowTimestamp] = useState(getServerNow());

  // Test taking state
  const [userAnswers, setUserAnswers] = useState<Record<number, any>>({});
  const [submittingTest, setSubmittingTest] = useState(false);
  const [testResultSummary, setTestResultSummary] = useState<any>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const fetchData = async () => {
    if (!programId) return;
    try {
      const [progRes, contentRes, attRes, assessRes, subRes, resultsRes] = await Promise.all([
        getProgramById(programId),
        getCourseContent(programId),
        getMyAttendance(programId).catch(() => ({ success: false, data: null })),
        getCourseAssessment(programId).catch(() => ({ success: false, data: null })),
        getMySubmission(programId).catch(() => ({ success: false, data: null })),
        getMyCourseResults(programId).catch(() => ({ success: false, data: null })),
      ]);

      if (progRes.success && progRes.data) setProgram(progRes.data);
      if (contentRes.success && contentRes.data) {
        setContent(contentRes.data);
        setCompletedModules(contentRes.userProgress || []);
        if (contentRes.data.modules && contentRes.data.modules.length > 0) {
          setSelectedModule(contentRes.data.modules[0]);
        }
      }
      if (attRes?.success) setAttendance(attRes.data || null);
      if (assessRes?.success) setAssessment(assessRes.data || null);
      if (subRes?.success) setSubmission(subRes.data || null);

      if (resultsRes?.success && resultsRes.data) {
        setAttemptHistory(resultsRes.data.results || []);
        setEnrollment(resultsRes.data.enrollment || null);
      }
    } catch (err) {
      console.error('Failed to load course details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [programId]);

  // Live timer tick for cooldown calculation (server-synchronized)
  useEffect(() => {
    const timer = setInterval(() => {
      setNowTimestamp(getServerNow());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleRefreshStatus = async () => {
    setRefreshingStatus(true);
    await fetchData();
    setTimeout(() => setRefreshingStatus(false), 600);
  };

  const handleToggleModule = async (moduleId: string) => {
    if (!programId) return;
    try {
      const res = await toggleModuleProgress(programId, moduleId);
      if (res.success) {
        if (res.data?.completed) {
          setCompletedModules((prev) => [...prev, moduleId]);
        } else {
          setCompletedModules((prev) => prev.filter((id) => id !== moduleId));
        }
        const attRes = await getMyAttendance(programId).catch(() => null);
        if (attRes?.success) setAttendance(attRes.data || null);
      }
    } catch (err) {
      console.error('Failed to toggle module:', err);
    }
  };

  const handleSelectAnswer = (qIndex: number, optionIndex: number) => {
    setUserAnswers((prev) => ({
      ...prev,
      [qIndex]: { ...prev[qIndex], selectedOption: optionIndex },
    }));
  };

  const handleTextAnswer = (qIndex: number, text: string) => {
    setUserAnswers((prev) => ({
      ...prev,
      [qIndex]: { ...prev[qIndex], answerText: text },
    }));
  };

  const handleSubmitAssessment = async () => {
    if (!programId || !assessment) return;
    setSubmittingTest(true);
    setSubmitError(null);
    setShowConfirmSubmit(false);

    try {
      const formattedAnswers = assessment.questions.map((q, idx) => ({
        questionIndex: idx,
        selectedOption: userAnswers[idx]?.selectedOption,
        answerText: userAnswers[idx]?.answerText,
      }));

      const res = await submitCourseAssessment(programId, formattedAnswers);
      if (res.success && res.data) {
        setSubmission(res.data);
        if (res.summary) setTestResultSummary(res.summary);
        await fetchData();
      }
    } catch (err: any) {
      setSubmitError(err.response?.data?.error || err.message || 'Submission failed');
    } finally {
      setSubmittingTest(false);
    }
  };

  if (loading) return <LoadingSpinner text="Loading course delivery environment..." />;
  if (!program) return <EmptyState title="Program not found" description="The requested training program does not exist." />;

  const totalModulesCount = content?.modules?.length || 0;
  const completedCount = completedModules.length;
  const progressPercent = totalModulesCount > 0 ? Math.round((completedCount / totalModulesCount) * 100) : 0;
  const isAttendanceSatisfied = (attendance?.attendancePercentage || progressPercent) >= (content?.passingAttendancePercentage || 75);

  // Attempt & Cooldown Calculations
  const maxAttempts = program?.maxAttempts || 3;
  const attemptsCount = enrollment?.attemptsCount ?? attemptHistory.length ?? 0;
  const remainingAttempts = Math.max(0, maxAttempts - attemptsCount);
  const cooldownHours = program?.cooldownHours ?? 24;

  const lastFailedAt = enrollment?.lastFailedAttemptAt ? new Date(enrollment.lastFailedAttemptAt).getTime() : null;
  const cooldownDurationMs = cooldownHours * 3600000;
  const cooldownExpiresAt = lastFailedAt ? lastFailedAt + cooldownDurationMs : 0;

  const formatCountdown = (ms: number) => {
    const totalSec = Math.floor(ms / 1000);
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    if (hrs > 0) return `${hrs}h ${mins}m ${secs}s`;
    return `${mins}m ${secs}s`;
  };

  // Determine Current Test Visual State (Strictly Mutually Exclusive Hierarchy)
  // State 1: Certified / Passed
  const isCertified = enrollment?.status === 'certified' || submission?.passed === true;

  // State 2: Subjective attempt pending evaluator review
  const latestResult = attemptHistory.length > 0 ? attemptHistory[attemptHistory.length - 1] : null;
  const isPendingGrading = !isCertified && (latestResult?.status === 'pending' || submission?.status === 'submitted');

  // State 3: Attendance prerequisite pending
  const isAttendanceFulfilled = !enrollment || ['attended', 'completed', 'certified'].includes(enrollment.status);
  const isAttendancePrerequisite = !isCertified && !isPendingGrading && !isAttendanceFulfilled;

  // State 4: Cooldown active after failed attempt
  const isCooldownActive = Boolean(
    !isCertified &&
    !isPendingGrading &&
    !isAttendancePrerequisite &&
    remainingAttempts > 0 &&
    lastFailedAt &&
    cooldownExpiresAt > nowTimestamp
  );
  const cooldownRemainingMs = Math.max(0, cooldownExpiresAt - nowTimestamp);

  // State 5: Maximum attempts exhausted
  const isMaxAttemptsReached = !isCertified && !isPendingGrading && !isAttendancePrerequisite && remainingAttempts <= 0;

  // Form: Enabled when no blocker banner is active
  const canTakeTest = !isCertified && !isPendingGrading && !isAttendancePrerequisite && !isMaxAttemptsReached && !isCooldownActive && remainingAttempts > 0;

  // Find Certificate
  const activeCertificate = enrollment?.certificateId || latestResult?.certificateId;

  const handleCopyVerificationLink = async () => {
    if (!activeCertificate?.verificationToken) return;
    const url = `${window.location.origin}/verify/${activeCertificate.verificationToken}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {}
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div>
          <button
            onClick={() => navigate('/training/my-enrollments')}
            className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-blue-600 mb-2 cursor-pointer transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to My Enrollments
          </button>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">{program.title}</h1>
            <Badge variant="info">{program.type}</Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Organizer: <strong className="text-slate-700">{program.organizer}</strong> • Mode: <span className="capitalize">{program.mode}</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          {content?.externalCourseUrl && (
            <a
              href={content.externalCourseUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-xl text-xs font-bold hover:bg-indigo-100 transition-colors shadow-2xs"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Launch {content.externalLmsProvider || 'External LMS'}</span>
            </a>
          )}
          {isCertified && (
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-extrabold shadow-2xs">
              <Award className="w-4 h-4 text-emerald-600" />
              <span>Certified Completed</span>
            </div>
          )}
        </div>
      </div>

      {/* Progress & Milestone Bar */}
      <Card className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 border-none shadow-md">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-200">Module Completion</span>
            <div className="flex items-center gap-3 mt-1.5">
              <div className="flex-1 bg-white/20 rounded-full h-2.5 overflow-hidden">
                <div className="bg-blue-400 h-full transition-all duration-500" style={{ width: `${progressPercent}%` }} />
              </div>
              <span className="text-sm font-extrabold text-white">{progressPercent}%</span>
            </div>
            <span className="text-[11px] text-slate-300 mt-1 block">
              {completedCount} of {totalModulesCount} modules completed
            </span>
          </div>

          <div className="border-t md:border-t-0 md:border-l border-white/10 pt-3 md:pt-0 md:pl-6">
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-200">Attendance Benchmark</span>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-lg font-extrabold">
                {attendance?.attendancePercentage != null ? `${attendance.attendancePercentage}%` : `${progressPercent}%`}
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                  isAttendanceSatisfied
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}
              >
                {isAttendanceSatisfied ? '✓ Benchmark Met (75% min)' : 'In Progress'}
              </span>
            </div>
          </div>

          <div className="border-t md:border-t-0 md:border-l border-white/10 pt-3 md:pt-0 md:pl-6">
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-200">Certification Status</span>
            <div className="flex items-center gap-2 mt-1">
              {isCertified ? (
                <>
                  <span className="text-lg font-extrabold text-emerald-300">Certified ✓</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Official Badge
                  </span>
                </>
              ) : isPendingGrading ? (
                <>
                  <span className="text-sm font-extrabold text-amber-300">Pending Review</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Evaluating
                  </span>
                </>
              ) : (
                <button
                  onClick={() => setActiveTab('assessment')}
                  className="text-xs font-bold text-blue-300 hover:text-white underline cursor-pointer"
                >
                  Take Assessment ({remainingAttempts} attempts left) →
                </button>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('modules')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'modules' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Course Modules ({totalModulesCount})</span>
        </button>

        <button
          onClick={() => setActiveTab('attendance')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'attendance' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <CalendarCheck className="w-4 h-4" />
          <span>Session Attendance ({attendance?.sessions?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab('assessment')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'assessment' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <CheckSquare className="w-4 h-4" />
          <span>Certification Assessment {assessment ? `(${assessment.questions.length})` : ''}</span>
          {isCertified && <span className="w-2 h-2 rounded-full bg-emerald-500" />}
        </button>
      </div>

      {/* ── TAB 1: MODULES ── */}
      {activeTab === 'modules' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {selectedModule ? (
              <Card className="p-6 space-y-4">
                <div className="flex items-start justify-between gap-4 pb-3 border-b border-slate-100">
                  <div>
                    <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">
                      Module {selectedModule.order}
                    </span>
                    <h2 className="text-lg font-bold text-slate-900 mt-0.5">{selectedModule.title}</h2>
                    {selectedModule.durationMinutes && (
                      <span className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {selectedModule.durationMinutes} minutes
                      </span>
                    )}
                  </div>
                  <Button
                    variant={completedModules.includes(selectedModule._id || '') ? 'outline' : 'primary'}
                    size="sm"
                    onClick={() => handleToggleModule(selectedModule._id || '')}
                  >
                    {completedModules.includes(selectedModule._id || '') ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 mr-1.5" />
                        Mark Incomplete
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4 mr-1.5" />
                        Mark as Done
                      </>
                    )}
                  </Button>
                </div>

                <div className="text-xs text-slate-600 leading-relaxed space-y-3">
                  <p>{selectedModule.description || 'Review the attached learning resource to complete this pedagogical module.'}</p>
                </div>

                {selectedModule.contentUrl && (
                  <div className="pt-2">
                    <a
                      href={selectedModule.contentUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-50 border border-blue-200 text-blue-700 rounded-xl text-xs font-bold hover:bg-blue-100 transition-colors"
                    >
                      <PlayCircle className="w-4 h-4" />
                      <span>Open Learning Material / Lecture Video</span>
                      <ExternalLink className="w-3.5 h-3.5 ml-1 text-blue-400" />
                    </a>
                  </div>
                )}
              </Card>
            ) : (
              <EmptyState title="Select a module" description="Choose a module from the list on the right to view its materials." />
            )}
          </div>

          <div className="space-y-3">
            <Card className="p-4 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Course Syllabus</h3>
              <div className="space-y-1.5">
                {content?.modules?.map((m) => {
                  const isDone = completedModules.includes(m._id || '');
                  const isCur = selectedModule?._id === m._id;
                  return (
                    <div
                      key={m._id || m.order}
                      onClick={() => setSelectedModule(m)}
                      className={`p-3 rounded-xl border text-xs cursor-pointer flex items-center justify-between transition-all ${
                        isCur
                          ? 'border-blue-500 bg-blue-50/70 text-blue-900 font-bold'
                          : 'border-slate-200/80 bg-white hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {isDone ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        ) : (
                          <div className="w-4 h-4 rounded-full border border-slate-300 shrink-0" />
                        )}
                        <span className="truncate">{m.order}. {m.title}</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* ── TAB 2: LIVE SESSION ATTENDANCE ── */}
      {activeTab === 'attendance' && (
        <Card className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Live Session Attendance Log</h3>
              <p className="text-xs text-slate-500">Instructor-verified session participation records</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-700">Required Benchmark: {content?.passingAttendancePercentage || 75}%</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/training/programs/${programId}/sessions`)}
                className="flex items-center gap-1.5 text-xs"
              >
                <CalendarCheck className="w-3.5 h-3.5 text-blue-600" />
                <span>Multi-Session Schedule &amp; Roster</span>
              </Button>
            </div>
          </div>

          {!attendance?.sessions || attendance.sessions.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400 space-y-1">
              <CalendarCheck className="w-8 h-8 mx-auto text-slate-300" />
              <p className="font-semibold text-slate-600">No scheduled live sessions logged yet</p>
              <p>For asynchronous/self-paced courses, attendance is derived automatically from module completion ({progressPercent}%).</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Session Date</th>
                    <th className="py-3 px-4">Session Title</th>
                    <th className="py-3 px-4">Attendance Status</th>
                    <th className="py-3 px-4">Instructor Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {attendance.sessions.map((s, i) => (
                    <tr key={s._id || i} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-slate-900">{new Date(s.sessionDate).toLocaleDateString()}</td>
                      <td className="py-3.5 px-4">{s.sessionTitle}</td>
                      <td className="py-3.5 px-4">
                        <Badge variant={s.present ? 'success' : 'danger'}>
                          {s.present ? 'Present ✓' : 'Absent ✗'}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">{s.notes || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* ── TAB 3: COURSE ASSESSMENT TEST ── */}
      {activeTab === 'assessment' && (
        <div className="space-y-6">
          {assessment ? (
            <Card className="space-y-6 p-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">{assessment.title}</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {assessment.instructions || 'Answer all questions to demonstrate your acquired pedagogical competency.'}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="info">Passing Benchmark: {assessment.passingScore}%</Badge>
                  <Badge variant="muted">{assessment.questions.length} Questions</Badge>
                  <Badge variant="teal">Attempts Allowed: {maxAttempts}</Badge>
                </div>
              </div>

              {/* ── 4 DISTINCT VISUAL STATE BANNERS ── */}

              {/* STATE 1: PASSED & CERTIFIED */}
              {isCertified && (
                <div className="p-5 rounded-2xl border-2 border-emerald-300 bg-gradient-to-r from-emerald-50 via-teal-50/50 to-emerald-50 text-emerald-950 space-y-3 shadow-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20">
                        <Award className="w-7 h-7" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-base text-emerald-900">
                          🎉 Congratulations! Official Certification Earned
                        </h4>
                        <p className="text-xs text-emerald-800/90 mt-0.5">
                          Score: <strong>{latestResult?.score ?? submission?.percentageScore}%</strong> • Passing Benchmark: {assessment.passingScore}% • Credential Issued
                        </p>
                      </div>
                    </div>
                    <Badge variant="success">Certified &amp; Recorded</Badge>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-emerald-200/60">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        if (activeCertificate) {
                          setSelectedCert(activeCertificate);
                        } else {
                          navigate('/certificates');
                        }
                      }}
                    >
                      <Award className="w-3.5 h-3.5 mr-1.5" />
                      View Official Certificate
                    </Button>

                    {activeCertificate?.verificationToken && (
                      <>
                        <Button variant="outline" size="sm" onClick={handleCopyVerificationLink}>
                          {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600 mr-1.5" /> : <Copy className="w-3.5 h-3.5 mr-1.5" />}
                          {copiedLink ? 'Link Copied!' : 'Copy Verification Link'}
                        </Button>
                        <a
                          href={`/verify/${activeCertificate.verificationToken}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-bold text-emerald-700 hover:text-emerald-900 inline-flex items-center gap-1 ml-1"
                        >
                          <span>Open Public Badge</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* STATE 2: PENDING EVALUATOR REVIEW */}
              {isPendingGrading && !isCertified && (
                <div className="p-5 rounded-2xl border-2 border-amber-300 bg-amber-50 text-amber-950 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center">
                        <Clock className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-amber-900">
                          Assessment Submitted • Pending Evaluator Review
                        </h4>
                        <p className="text-xs text-amber-800 mt-0.5">
                          Your submission contains subjective free-text questions currently being evaluated by the course instructor.
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      loading={refreshingStatus}
                      onClick={handleRefreshStatus}
                    >
                      <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                      Check Status
                    </Button>
                  </div>
                  <div className="text-[11px] text-amber-700 bg-amber-100/60 p-2.5 rounded-xl border border-amber-200 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                    <span>
                      You will automatically receive an in-app notification when grading is finalized and your certificate is generated.
                    </span>
                  </div>
                </div>
              )}

              {/* STATE 3: FAILED WITH ACTIVE COOLDOWN */}
              {isCooldownActive && !isCertified && remainingAttempts > 0 && (
                <div className="p-5 rounded-2xl border-2 border-amber-300 bg-amber-50/80 text-amber-950 space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-amber-900">
                        Cooldown Active • Retake Temporarily Locked
                      </h4>
                      <p className="text-xs text-amber-800">
                        You have scored below the passing benchmark on your last attempt. Institutional policy enforces a {cooldownHours}h cooldown.
                      </p>
                    </div>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-amber-200/80 flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700">Retake Unlocks In:</span>
                    <span className="font-mono font-extrabold text-amber-800 text-sm">
                      {formatCountdown(cooldownRemainingMs)}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Remaining attempts: <strong>{remainingAttempts}</strong> of {maxAttempts}.
                  </div>
                </div>
              )}

              {/* STATE 4: MAX ATTEMPTS EXHAUSTED */}
              {isMaxAttemptsReached && (
                <div className="p-5 rounded-2xl border-2 border-rose-300 bg-rose-50 text-rose-950 space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-rose-900">
                        Maximum Attempts Exhausted ({maxAttempts}/{maxAttempts})
                      </h4>
                      <p className="text-xs text-rose-800">
                        All allotted assessment attempts have been used. Additional submissions are locked.
                      </p>
                    </div>
                  </div>
                  <p className="text-[11px] text-rose-700 bg-rose-100/70 p-2.5 rounded-xl border border-rose-200">
                    If you encountered network or technical disruption during an attempt, please contact your Department Head (HOD) or Academic Dean to request an administrative retake reset.
                  </p>
                </div>
              )}

              {/* STATE 3: ATTENDANCE PREREQUISITE PENDING */}
              {isAttendancePrerequisite && (
                <div className="p-5 rounded-2xl border-2 border-amber-300 bg-amber-50 text-amber-950 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0">
                        <AlertCircle className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-amber-900">
                          Attendance Prerequisite Required Before Assessment
                        </h4>
                        <p className="text-xs text-amber-800 mt-0.5">
                          You must complete attendance for all scheduled program sessions and have presence recorded by the session organiser before taking this certification test (Current enrollment status: &ldquo;{enrollment?.status || 'enrolled'}&rdquo;).
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => navigate(`/training/programs/${programId}/sessions`)}
                      className="shrink-0 flex items-center gap-1.5 shadow-sm"
                    >
                      <CalendarCheck className="w-3.5 h-3.5" />
                      <span>View Program Sessions</span>
                    </Button>
                  </div>
                </div>
              )}

              {submitError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">
                  {submitError}
                </div>
              )}

              {/* ── QUESTION FORM (ENABLED WHEN canTakeTest) ── */}
              {canTakeTest ? (
                <div className="space-y-6 pt-2">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="text-xs font-bold text-slate-700">
                      Attempt {attemptsCount + 1} of {maxAttempts}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      All questions are mandatory
                    </span>
                  </div>

                  {assessment.questions.map((q, idx) => (
                    <div key={q._id || idx} className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <span className="font-bold text-xs text-slate-900 leading-snug">
                          Question {idx + 1}. {q.prompt}
                        </span>
                        <span className="text-[10px] text-slate-400 font-semibold uppercase shrink-0">
                          {q.maxScore || 10} pts
                        </span>
                      </div>

                      {q.type === 'mcq' && q.options && (
                        <div className="space-y-2 pt-1">
                          {q.options.map((opt, optIdx) => {
                            const isSelected = userAnswers[idx]?.selectedOption === optIdx;
                            return (
                              <label
                                key={optIdx}
                                className={`flex items-center gap-3 p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                                  isSelected
                                    ? 'bg-blue-50 border-blue-400 text-blue-900 font-semibold'
                                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                                }`}
                              >
                                <input
                                  type="radio"
                                  name={`q_${idx}`}
                                  checked={isSelected}
                                  onChange={() => setUserAnswers((prev) => ({ ...prev, [idx]: { selectedOption: optIdx } }))}
                                  className="accent-blue-600"
                                />
                                <span>{opt}</span>
                              </label>
                            );
                          })}
                        </div>
                      )}

                      {(q.type === 'short_answer' || q.type === 'file_upload' || !q.options) && (
                        <div className="space-y-1 pt-1">
                          <textarea
                            rows={4}
                            maxLength={2000}
                            value={userAnswers[idx]?.answerText || ''}
                            onChange={(e) =>
                              setUserAnswers((prev) => ({
                                ...prev,
                                [idx]: { answerText: e.target.value.slice(0, 2000) },
                              }))
                            }
                            placeholder="Type your comprehensive response here (up to 2000 characters)..."
                            className="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs text-slate-900 bg-white leading-relaxed"
                          />
                          <div className="flex items-center justify-between text-[10px] text-slate-400">
                            <span>Evaluated manually by course instructor</span>
                            <span>{(userAnswers[idx]?.answerText?.length || 0)} / 2000 characters</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Submit Trigger */}
                  <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                    <span className="text-xs text-slate-500">
                      Remaining attempts after this submission: {remainingAttempts - 1}
                    </span>
                    <Button
                      variant="primary"
                      size="md"
                      onClick={() => setShowConfirmSubmit(true)}
                      className="flex items-center gap-2"
                    >
                      <Send className="w-4 h-4" />
                      <span>Submit Attempt {attemptsCount + 1}</span>
                    </Button>
                  </div>
                </div>
              ) : null}

              {/* ── MULTI-ATTEMPT HISTORY TIMELINE ACCORDION ── */}
              {attemptHistory.length > 0 && (
                <div className="pt-6 border-t border-slate-200/80 space-y-3">
                  <div className="flex items-center gap-2">
                    <History className="w-4 h-4 text-slate-500" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Attempt History ({attemptHistory.length})
                    </h3>
                  </div>

                  <div className="space-y-2">
                    {attemptHistory.map((att) => (
                      <div
                        key={att._id || att.attemptNumber}
                        className="p-3.5 rounded-xl border border-slate-200/70 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900">Attempt {att.attemptNumber}</span>
                            <Badge variant={att.passed === true ? 'success' : att.status === 'pending' ? 'warning' : 'danger'}>
                              {att.passed === true ? 'Passed' : att.status === 'pending' ? 'Pending Review' : 'Failed'}
                            </Badge>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Completed: {new Date(att.completedAt).toLocaleString()} • Score:{' '}
                            <strong>{att.score}%</strong> (Passing Benchmark: {att.passingScore}%)
                          </p>
                        </div>

                        {att.certificateId && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedCert(att.certificateId)}
                          >
                            <Award className="w-3 h-3 mr-1 text-amber-500" />
                            View Certificate
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          ) : (
            <EmptyState
              title="No assessment configured for this course"
              description="The course coordinator has not published a graded test for this program."
            />
          )}
        </div>
      )}

      {/* Confirmation Modal Before Submission */}
      <Modal
        open={showConfirmSubmit}
        onClose={() => setShowConfirmSubmit(false)}
        title="Confirm Assessment Submission"
        size="sm"
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <Button variant="ghost" onClick={() => setShowConfirmSubmit(false)}>
              Back to Review
            </Button>
            <Button variant="primary" loading={submittingTest} onClick={handleSubmitAssessment}>
              Confirm &amp; Submit Attempt {attemptsCount + 1}
            </Button>
          </div>
        }
      >
        <div className="space-y-3 text-xs text-slate-600">
          <p>
            You are about to submit <strong>Attempt {attemptsCount + 1}</strong> of <strong>{maxAttempts}</strong> for{' '}
            <strong>{assessment?.title}</strong>.
          </p>
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-[11px] leading-relaxed">
            Please make sure you have answered all questions. If you do not meet the {assessment?.passingScore}% passing benchmark, a {cooldownHours}-hour cooldown will apply before your next attempt.
          </div>
        </div>
      </Modal>

      {/* Certificate Modal */}
      <CertificateModal
        certificate={selectedCert}
        open={!!selectedCert}
        onClose={() => setSelectedCert(null)}
      />
    </div>
  );
};
