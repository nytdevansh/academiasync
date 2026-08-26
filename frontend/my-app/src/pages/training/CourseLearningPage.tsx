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
  CheckSquare
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { getProgramById } from '../../api/training';
import {
  getCourseContent,
  toggleModuleProgress,
  getMyAttendance,
  getCourseAssessment,
  submitCourseAssessment,
  getMySubmission,
  type CourseContent,
  type CourseModule,
  type AttendanceRecord,
  type CourseAssessment,
  type CourseAssessmentSubmission
} from '../../api/lms';
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

  // Test taking state
  const [userAnswers, setUserAnswers] = useState<Record<number, any>>({});
  const [submittingTest, setSubmittingTest] = useState(false);
  const [testResultSummary, setTestResultSummary] = useState<any>(null);

  const fetchData = async () => {
    if (!programId) return;
    try {
      const [progRes, contentRes, attRes, assessRes, subRes] = await Promise.all([
        getProgramById(programId),
        getCourseContent(programId),
        getMyAttendance(programId).catch(() => ({ success: false, data: null })),
        getCourseAssessment(programId).catch(() => ({ success: false, data: null })),
        getMySubmission(programId).catch(() => ({ success: false, data: null })),
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
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [programId]);

  const handleToggleModule = async (moduleId: string) => {
    if (!programId) return;
    try {
      const res = await toggleModuleProgress(programId, moduleId);
      if (res.success) {
        if (res.data.completed) {
          setCompletedModules(prev => [...prev, moduleId]);
        } else {
          setCompletedModules(prev => prev.filter(id => id !== moduleId));
        }
        // Refresh attendance to pick up derived async progress
        const attRes = await getMyAttendance(programId).catch(() => null);
        if (attRes?.success) setAttendance(attRes.data || null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmitTest = async () => {
    if (!programId || !assessment) return;
    setSubmittingTest(true);
    try {
      const formattedAnswers = assessment.questions.map((q, idx) => ({
        questionIndex: idx,
        selectedOption: userAnswers[idx]?.selectedOption,
        answerText: userAnswers[idx]?.answerText,
      }));

      const res = await submitCourseAssessment(programId, formattedAnswers);
      if (res.success && res.data) {
        setSubmission(res.data);
        setTestResultSummary(res.summary);
      }
    } catch (err) {
      console.error(err);
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
          {submission?.passed && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-extrabold">
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
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                isAttendanceSatisfied ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              }`}>
                {isAttendanceSatisfied ? '✓ Benchmark Met (75% min)' : 'In Progress'}
              </span>
            </div>
          </div>

          <div className="border-t md:border-t-0 md:border-l border-white/10 pt-3 md:pt-0 md:pl-6">
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-200">Assessment Score</span>
            <div className="flex items-center gap-2 mt-1">
              {submission ? (
                <>
                  <span className="text-lg font-extrabold text-emerald-300">{submission.percentageScore}%</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                    submission.passed ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  }`}>
                    {submission.passed ? 'Passed ✓' : 'Needs Retake'}
                  </span>
                </>
              ) : (
                <button
                  onClick={() => setActiveTab('assessment')}
                  className="text-xs font-bold text-blue-300 hover:text-white underline cursor-pointer"
                >
                  Take Completion Test →
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
          <span>Live Sessions &amp; Attendance</span>
        </button>

        <button
          onClick={() => setActiveTab('assessment')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'assessment' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Course Assessment &amp; Evidence Test</span>
        </button>
      </div>

      {/* ── TAB 1: MODULES & LEARNING CONTENT ── */}
      {activeTab === 'modules' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Delivery Player */}
          <div className="lg:col-span-8 space-y-4">
            {selectedModule ? (
              <Card className="space-y-4 p-6">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    {selectedModule.type === 'video' && <PlayCircle className="w-5 h-5 text-blue-600" />}
                    {selectedModule.type === 'document' && <FileText className="w-5 h-5 text-teal-600" />}
                    {selectedModule.type === 'link' && <ExternalLink className="w-5 h-5 text-indigo-600" />}
                    {selectedModule.type === 'quiz' && <HelpCircle className="w-5 h-5 text-amber-600" />}
                    <div>
                      <h2 className="text-base font-bold text-slate-900">{selectedModule.title}</h2>
                      <span className="text-xs text-slate-400 capitalize">{selectedModule.type} Resource • ~{selectedModule.durationMinutes || 30} mins</span>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    variant={completedModules.includes(selectedModule._id || '') ? 'success' : 'primary'}
                    onClick={() => handleToggleModule(selectedModule._id || '')}
                  >
                    {completedModules.includes(selectedModule._id || '') ? '✓ Marked Completed' : 'Mark Module Completed'}
                  </Button>
                </div>

                {selectedModule.description && (
                  <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                    {selectedModule.description}
                  </p>
                )}

                {/* Content Frame / Media Preview */}
                <div className="bg-slate-900 rounded-2xl overflow-hidden min-h-[320px] flex flex-col items-center justify-center p-8 text-center text-white relative">
                  {selectedModule.type === 'video' ? (
                    <div className="space-y-3">
                      <PlayCircle className="w-16 h-16 text-blue-400 mx-auto animate-pulse" />
                      <p className="font-bold text-sm">Online Video Lecture Ready</p>
                      <a
                        href={selectedModule.contentUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md"
                      >
                        <ExternalLink className="w-4 h-4" /> Open Video Stream
                      </a>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <FileText className="w-16 h-16 text-teal-400 mx-auto" />
                      <p className="font-bold text-sm">Course Reading &amp; Handout Material</p>
                      <a
                        href={selectedModule.contentUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-all shadow-md"
                      >
                        <ExternalLink className="w-4 h-4" /> Open Course Document
                      </a>
                    </div>
                  )}
                </div>
              </Card>
            ) : (
              <EmptyState title="No modules in this course yet" description="The instructor has not uploaded course modules." />
            )}
          </div>

          {/* Module List Sidebar */}
          <div className="lg:col-span-4 space-y-3">
            <Card className="p-4">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-3">Course Curriculum</h3>
              <div className="space-y-2">
                {content?.modules?.map((m, idx) => {
                  const isDone = completedModules.includes(m._id || '');
                  const isSelected = selectedModule?._id === m._id;
                  return (
                    <div
                      key={m._id || idx}
                      onClick={() => setSelectedModule(m)}
                      className={`p-3 rounded-xl border text-xs transition-all cursor-pointer flex items-center justify-between gap-2 ${
                        isSelected ? 'bg-blue-50/80 border-blue-400 shadow-2xs' : 'bg-white border-slate-200/80 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleModule(m._id || '');
                          }}
                          className="cursor-pointer text-slate-400 hover:text-blue-600"
                        >
                          {isDone ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                          ) : (
                            <div className="w-4 h-4 rounded-full border border-slate-300 flex-shrink-0" />
                          )}
                        </button>
                        <div className="truncate">
                          <span className={`font-bold block truncate ${isDone ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                            {idx + 1}. {m.title}
                          </span>
                          <span className="text-[10px] text-slate-400">{m.durationMinutes || 30}m • {m.type}</span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-300 flex-shrink-0" />
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
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Live Session Attendance Log</h3>
              <p className="text-xs text-slate-500">Instructor verified session participation records</p>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold text-slate-700">Required Benchmark: {content?.passingAttendancePercentage || 75}%</span>
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
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">{assessment.title}</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {assessment.instructions || 'Answer all questions to demonstrate your acquired competency.'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="info">Passing Mark: {assessment.passingScore}%</Badge>
                  <Badge variant="muted">{assessment.questions.length} Questions</Badge>
                </div>
              </div>

              {/* Previous Result Banner */}
              {submission && (
                <div className={`p-4 rounded-xl border flex items-center justify-between ${
                  submission.passed ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-rose-50 border-rose-200 text-rose-900'
                }`}>
                  <div className="flex items-center gap-3">
                    <Award className={`w-8 h-8 ${submission.passed ? 'text-emerald-600' : 'text-rose-600'}`} />
                    <div>
                      <h4 className="font-extrabold text-sm">
                        {submission.passed ? '🎉 Congratulations! You Passed the Assessment' : 'Assessment Result: Needs Retake'}
                      </h4>
                      <p className="text-xs opacity-90">
                        Score: <strong>{submission.percentageScore}%</strong> (Passing Benchmark: {assessment.passingScore}%) • Submitted {new Date(submission.submittedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  {submission.passed && (
                    <Badge variant="success">Completed &amp; Certified</Badge>
                  )}
                </div>
              )}

              {/* Questions List */}
              <div className="space-y-6 pt-2">
                {assessment.questions.map((q, idx) => (
                  <div key={q._id || idx} className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <span className="font-bold text-xs text-slate-900">
                        Question {idx + 1}. {q.prompt}
                      </span>
                      <span className="text-[10px] text-slate-400 font-semibold uppercase">{q.maxScore || 10} pts</span>
                    </div>

                    {q.type === 'mcq' && q.options && (
                      <div className="space-y-2 pt-1">
                        {q.options.map((opt, optIdx) => {
                          const isSelected = userAnswers[idx]?.selectedOption === optIdx;
                          return (
                            <label
                              key={optIdx}
                              className={`flex items-center gap-3 p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                                isSelected ? 'bg-blue-50 border-blue-400 text-blue-900 font-semibold' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                              }`}
                            >
                              <input
                                type="radio"
                                name={`q_${idx}`}
                                checked={isSelected}
                                onChange={() => setUserAnswers(prev => ({ ...prev, [idx]: { selectedOption: optIdx } }))}
                                className="accent-blue-600"
                              />
                              <span>{opt}</span>
                            </label>
                          );
                        })}
                      </div>
                    )}

                    {q.type === 'short_answer' && (
                      <textarea
                        rows={3}
                        value={userAnswers[idx]?.answerText || ''}
                        onChange={(e) => setUserAnswers(prev => ({ ...prev, [idx]: { answerText: e.target.value } }))}
                        placeholder="Enter your detailed response..."
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs text-slate-900 bg-white"
                      />
                    )}
                  </div>
                ))}
              </div>

              {/* Submit Button */}
              <div className="flex justify-end pt-4 border-t border-slate-100">
                <Button
                  variant="primary"
                  size="md"
                  loading={submittingTest}
                  onClick={handleSubmitTest}
                  className="flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  <span>Submit Assessment &amp; Auto-Grade</span>
                </Button>
              </div>
            </Card>
          ) : (
            <EmptyState
              title="No assessment configured for this course"
              description="The course coordinator has not published a graded test for this program."
            />
          )}
        </div>
      )}
    </div>
  );
};
