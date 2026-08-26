import React, { useEffect, useState } from 'react';
import {
  BookOpen,
  CalendarCheck,
  Award,
  PlusCircle,
  Trash2,
  CheckCircle2,
  XCircle,
  Save,
  Users,
  ExternalLink,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import {
  getCourseContent,
  upsertCourseContent,
  getProgramAttendance,
  markSessionAttendance,
  getCourseAssessment,
  upsertCourseAssessment,
  getProgramSubmissions,
  type CourseContent,
  type CourseModule,
  type AssessmentQuestion,
  type CourseAssessmentSubmission
} from '../../api/lms';

interface CourseManageModalProps {
  open: boolean;
  onClose: () => void;
  programId: string;
  programTitle: string;
}

export const CourseManageModal: React.FC<CourseManageModalProps> = ({
  open,
  onClose,
  programId,
  programTitle,
}) => {
  const [tab, setTab] = useState<'modules' | 'attendance' | 'assessment'>('modules');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Modules State
  const [modules, setModules] = useState<CourseModule[]>([]);
  const [externalCourseUrl, setExternalCourseUrl] = useState('');
  const [externalLmsProvider, setExternalLmsProvider] = useState('Internal');
  const [passingAttendancePercentage, setPassingAttendancePercentage] = useState(75);

  // New module draft
  const [newModTitle, setNewModTitle] = useState('');
  const [newModType, setNewModType] = useState<'video' | 'document' | 'link' | 'quiz'>('video');
  const [newModUrl, setNewModUrl] = useState('');
  const [newModDuration, setNewModDuration] = useState(30);

  // Attendance State
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().split('T')[0]);
  const [sessionTitle, setSessionTitle] = useState('Day 1 Interactive Session');
  const [rosterAttendance, setRosterAttendance] = useState<Record<string, boolean>>({});

  // Assessment State
  const [assessmentTitle, setAssessmentTitle] = useState('Course Completion Assessment');
  const [assessmentPassingScore, setAssessmentPassingScore] = useState(60);
  const [assessmentInstructions, setAssessmentInstructions] = useState('Complete the following multiple choice test.');
  const [questions, setQuestions] = useState<AssessmentQuestion[]>([]);
  const [submissions, setSubmissions] = useState<CourseAssessmentSubmission[]>([]);

  // New question draft
  const [newPrompt, setNewPrompt] = useState('');
  const [newOpt0, setNewOpt0] = useState('');
  const [newOpt1, setNewOpt1] = useState('');
  const [newOpt2, setNewOpt2] = useState('');
  const [newOpt3, setNewOpt3] = useState('');
  const [newCorrectAns, setNewCorrectAns] = useState(0);

  const loadData = async () => {
    if (!programId || !open) return;
    setLoading(true);
    try {
      const [cRes, aRes, assessRes, subRes] = await Promise.all([
        getCourseContent(programId).catch(() => ({ success: false, data: null })),
        getProgramAttendance(programId).catch(() => ({ success: false, data: null, enrollments: [] })),
        getCourseAssessment(programId).catch(() => ({ success: false, data: null })),
        getProgramSubmissions(programId).catch(() => ({ success: false, data: [] })),
      ]);

      if (cRes.success && cRes.data) {
        setModules(cRes.data.modules || []);
        setExternalCourseUrl(cRes.data.externalCourseUrl || '');
        setExternalLmsProvider(cRes.data.externalLmsProvider || 'Internal');
        setPassingAttendancePercentage(cRes.data.passingAttendancePercentage || 75);
      }

      if (aRes.success && aRes.enrollments) {
        setEnrollments(aRes.enrollments || []);
        const initRoster: Record<string, boolean> = {};
        (aRes.enrollments || []).forEach((e: any) => { initRoster[e._id] = true; });
        setRosterAttendance(initRoster);
      }

      if (assessRes.success && assessRes.data) {
        setAssessmentTitle(assessRes.data.title || 'Course Completion Assessment');
        setAssessmentPassingScore(assessRes.data.passingScore ?? 60);
        setAssessmentInstructions(assessRes.data.instructions || '');
        setQuestions(assessRes.data.questions || []);
      }

      if (subRes.success && subRes.data) {
        setSubmissions(subRes.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [programId, open]);

  const handleAddModule = () => {
    if (!newModTitle || !newModUrl) return;
    const newM: CourseModule = {
      title: newModTitle,
      type: newModType,
      contentUrl: newModUrl,
      durationMinutes: Number(newModDuration) || 30,
      isRequired: true,
      order: modules.length + 1,
    };
    setModules([...modules, newM]);
    setNewModTitle('');
    setNewModUrl('');
  };

  const handleDeleteModule = (idx: number) => {
    setModules(modules.filter((_, i) => i !== idx));
  };

  const handleSaveModules = async () => {
    setSaving(true);
    try {
      await upsertCourseContent(programId, {
        modules,
        externalCourseUrl,
        externalLmsProvider,
        passingAttendancePercentage,
      });
      await loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const attendees = enrollments.map(e => ({
        enrollmentId: e._id,
        userId: e.userId?._id || e.userId,
        present: Boolean(rosterAttendance[e._id]),
      }));

      await markSessionAttendance(programId, {
        sessionDate,
        sessionTitle,
        attendees,
      });
      await loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleAddQuestion = () => {
    if (!newPrompt || !newOpt0 || !newOpt1) return;
    const options = [newOpt0, newOpt1];
    if (newOpt2) options.push(newOpt2);
    if (newOpt3) options.push(newOpt3);

    const q: AssessmentQuestion = {
      prompt: newPrompt,
      type: 'mcq',
      options,
      correctAnswer: Number(newCorrectAns),
      maxScore: 10,
    };

    setQuestions([...questions, q]);
    setNewPrompt('');
    setNewOpt0('');
    setNewOpt1('');
    setNewOpt2('');
    setNewOpt3('');
    setNewCorrectAns(0);
  };

  const handleDeleteQuestion = (idx: number) => {
    setQuestions(questions.filter((_, i) => i !== idx));
  };

  const handleSaveAssessment = async () => {
    setSaving(true);
    try {
      await upsertCourseAssessment(programId, {
        title: assessmentTitle,
        passingScore: assessmentPassingScore,
        instructions: assessmentInstructions,
        questions,
      });
      await loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Course LMS, Delivery & Assessment: ${programTitle}`}
      size="xl"
      footer={
        <div className="flex items-center justify-between w-full">
          <span className="text-xs text-slate-400">Configured changes apply in real-time to faculty learners</span>
          <Button variant="secondary" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      }
    >
      <div className="space-y-4 text-xs">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200">
          <button
            onClick={() => setTab('modules')}
            className={`px-4 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              tab === 'modules' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Modules &amp; Content ({modules.length})</span>
          </button>

          <button
            onClick={() => setTab('attendance')}
            className={`px-4 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              tab === 'attendance' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <CalendarCheck className="w-4 h-4" />
            <span>Mark Live Attendance ({enrollments.length} Enrolled)</span>
          </button>

          <button
            onClick={() => setTab('assessment')}
            className={`px-4 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              tab === 'assessment' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>Assessment &amp; Test Submissions ({questions.length} Qs)</span>
          </button>
        </div>

        {loading ? (
          <LoadingSpinner text="Loading course configuration..." />
        ) : (
          <>
            {/* ── TAB 1: MODULES & CONTENT ── */}
            {tab === 'modules' && (
              <div className="space-y-4">
                {/* External Provider settings */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">LMS Delivery Provider</label>
                    <select
                      value={externalLmsProvider}
                      onChange={(e) => setExternalLmsProvider(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-800"
                    >
                      <option value="Internal">AcademiaSync LMS (Built-in)</option>
                      <option value="Coursera">Coursera for Campus</option>
                      <option value="NPTEL">NPTEL / SWAYAM</option>
                      <option value="edX">edX</option>
                      <option value="Canvas">Canvas LMS</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">External Course URL (Optional)</label>
                    <input
                      type="url"
                      value={externalCourseUrl}
                      onChange={(e) => setExternalCourseUrl(e.target.value)}
                      placeholder="https://www.coursera.org/learn/..."
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Attendance Req. Benchmark (%)</label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={passingAttendancePercentage}
                      onChange={(e) => setPassingAttendancePercentage(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-800"
                    />
                  </div>
                </div>

                {/* Modules List */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-slate-800">Uploaded Course Modules</h4>
                    <span className="text-slate-400">{modules.length} active module(s)</span>
                  </div>

                  {modules.length === 0 ? (
                    <div className="text-center py-6 text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                      No modules added yet. Add your first video, PDF or quiz below.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {modules.map((m, idx) => (
                        <div key={idx} className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between gap-3 shadow-2xs">
                          <div className="flex items-center gap-2.5">
                            <span className="w-5 h-5 rounded-full bg-slate-100 font-bold text-slate-600 flex items-center justify-center text-[10px]">
                              {idx + 1}
                            </span>
                            <div>
                              <span className="font-bold text-slate-900">{m.title}</span>
                              <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                                <Badge variant="muted">{m.type}</Badge>
                                <span>~{m.durationMinutes}m</span>
                                <span className="truncate max-w-xs">{m.contentUrl}</span>
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => handleDeleteModule(idx)}
                            className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Add Module Box */}
                <div className="p-3.5 bg-blue-50/50 border border-blue-200 rounded-xl space-y-3">
                  <h4 className="font-bold text-blue-900">+ Add New Module</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                    <div className="sm:col-span-2">
                      <input
                        type="text"
                        placeholder="Module title (e.g. Lecture 1: Generative Architectures)"
                        value={newModTitle}
                        onChange={(e) => setNewModTitle(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-800"
                      />
                    </div>
                    <div>
                      <select
                        value={newModType}
                        onChange={(e) => setNewModType(e.target.value as any)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-800"
                      >
                        <option value="video">Video Stream</option>
                        <option value="document">PDF / Document</option>
                        <option value="link">External Link</option>
                        <option value="quiz">Quiz / Assignment</option>
                      </select>
                    </div>
                    <div>
                      <input
                        type="number"
                        placeholder="Duration (mins)"
                        value={newModDuration}
                        onChange={(e) => setNewModDuration(Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-800"
                      />
                    </div>
                  </div>
                  <div>
                    <input
                      type="url"
                      placeholder="Content URL (e.g. https://youtu.be/... or Cloudinary/S3 PDF link)"
                      value={newModUrl}
                      onChange={(e) => setNewModUrl(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-800"
                    />
                  </div>
                  <Button size="sm" variant="secondary" onClick={handleAddModule}>
                    + Append Module to List
                  </Button>
                </div>

                <div className="flex justify-end pt-2">
                  <Button variant="primary" size="sm" loading={saving} onClick={handleSaveModules} className="flex items-center gap-1.5">
                    <Save className="w-3.5 h-3.5" /> Save Course Modules
                  </Button>
                </div>
              </div>
            )}

            {/* ── TAB 2: MARK LIVE ATTENDANCE ── */}
            {tab === 'attendance' && (
              <form onSubmit={handleSaveAttendance} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Session Date *</label>
                    <input
                      type="date"
                      value={sessionDate}
                      onChange={(e) => setSessionDate(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-800"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Session Topic / Title *</label>
                    <input
                      type="text"
                      value={sessionTitle}
                      onChange={(e) => setSessionTitle(e.target.value)}
                      placeholder="e.g. Day 1: NEP 2020 OBE Framework"
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-800"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-slate-800">Enrolled Faculty Roster</h4>
                    <span className="text-slate-400">Check to mark Present</span>
                  </div>

                  {enrollments.length === 0 ? (
                    <div className="text-center py-8 text-slate-400 bg-slate-50 rounded-xl border border-dashed">
                      No approved faculty currently enrolled in this program.
                    </div>
                  ) : (
                    <div className="border border-slate-200 rounded-xl overflow-hidden max-h-64 overflow-y-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                          <tr>
                            <th className="py-2.5 px-3">Faculty Member</th>
                            <th className="py-2.5 px-3">Status</th>
                            <th className="py-2.5 px-3 text-right">Attendance for this Session</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {enrollments.map((e) => (
                            <tr key={e._id} className="hover:bg-slate-50">
                              <td className="py-2 px-3 font-semibold text-slate-800">
                                {e.userId?.name || 'Dr. Faculty'} ({e.userId?.email})
                              </td>
                              <td className="py-2 px-3">
                                <Badge variant="info">{e.status}</Badge>
                              </td>
                              <td className="py-2 px-3 text-right">
                                <label className="inline-flex items-center gap-1.5 cursor-pointer font-bold">
                                  <input
                                    type="checkbox"
                                    checked={Boolean(rosterAttendance[e._id])}
                                    onChange={(evt) => setRosterAttendance(prev => ({ ...prev, [e._id]: evt.target.checked }))}
                                    className="accent-blue-600 w-4 h-4"
                                  />
                                  <span className={rosterAttendance[e._id] ? 'text-emerald-700' : 'text-slate-400'}>
                                    {rosterAttendance[e._id] ? 'Present ✓' : 'Absent ✗'}
                                  </span>
                                </label>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                <div className="flex justify-end pt-2">
                  <Button variant="primary" size="sm" loading={saving} type="submit" className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Submit Session Attendance
                  </Button>
                </div>
              </form>
            )}

            {/* ── TAB 3: ASSESSMENT BUILDER & SUBMISSIONS ── */}
            {tab === 'assessment' && (
              <div className="space-y-4">
                {/* General Assessment Config */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="sm:col-span-2">
                    <label className="block font-bold text-slate-700 mb-1">Assessment Title *</label>
                    <input
                      type="text"
                      value={assessmentTitle}
                      onChange={(e) => setAssessmentTitle(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Pass Mark Benchmark (%) *</label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={assessmentPassingScore}
                      onChange={(e) => setAssessmentPassingScore(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-800"
                    />
                  </div>
                </div>

                {/* Questions List */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-slate-800">Test Questions ({questions.length})</h4>
                    <span className="text-slate-400">Auto-graded on submission</span>
                  </div>

                  {questions.length === 0 ? (
                    <div className="text-center py-6 text-slate-400 bg-slate-50 rounded-xl border border-dashed">
                      No assessment questions configured. Add MCQ questions below.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-56 overflow-y-auto">
                      {questions.map((q, idx) => (
                        <div key={idx} className="p-3 bg-white border border-slate-200 rounded-xl space-y-1 shadow-2xs">
                          <div className="flex items-start justify-between">
                            <span className="font-bold text-slate-900">{idx + 1}. {q.prompt}</span>
                            <button onClick={() => handleDeleteQuestion(idx)} className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          {q.options && (
                            <div className="grid grid-cols-2 gap-1 pt-1 text-[11px] text-slate-600">
                              {q.options.map((opt, oIdx) => (
                                <span key={oIdx} className={oIdx === q.correctAnswer ? 'text-emerald-700 font-bold' : ''}>
                                  {String.fromCharCode(65 + oIdx)}) {opt} {oIdx === q.correctAnswer ? '✓ (Correct)' : ''}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Add MCQ Question Box */}
                <div className="p-3.5 bg-indigo-50/60 border border-indigo-200 rounded-xl space-y-2">
                  <h4 className="font-bold text-indigo-950">+ Add Multiple Choice Question</h4>
                  <input
                    type="text"
                    placeholder="Enter question prompt (e.g. Which metric represents outcome-based CO attainment?)"
                    value={newPrompt}
                    onChange={(e) => setNewPrompt(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-800"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Option A"
                      value={newOpt0}
                      onChange={(e) => setNewOpt0(e.target.value)}
                      className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-800"
                    />
                    <input
                      type="text"
                      placeholder="Option B"
                      value={newOpt1}
                      onChange={(e) => setNewOpt1(e.target.value)}
                      className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-800"
                    />
                    <input
                      type="text"
                      placeholder="Option C (Optional)"
                      value={newOpt2}
                      onChange={(e) => setNewOpt2(e.target.value)}
                      className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-800"
                    />
                    <input
                      type="text"
                      placeholder="Option D (Optional)"
                      value={newOpt3}
                      onChange={(e) => setNewOpt3(e.target.value)}
                      className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-800"
                    />
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-700">Correct Option:</span>
                      <select
                        value={newCorrectAns}
                        onChange={(e) => setNewCorrectAns(Number(e.target.value))}
                        className="px-2 py-1 bg-white border border-slate-300 rounded-lg text-slate-800 font-bold"
                      >
                        <option value={0}>Option A</option>
                        <option value={1}>Option B</option>
                        <option value={2}>Option C</option>
                        <option value={3}>Option D</option>
                      </select>
                    </div>
                    <Button size="sm" variant="secondary" onClick={handleAddQuestion}>
                      + Add Question
                    </Button>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button variant="primary" size="sm" loading={saving} onClick={handleSaveAssessment} className="flex items-center gap-1.5">
                    <Save className="w-3.5 h-3.5" /> Save Assessment Configuration
                  </Button>
                </div>

                {/* Submissions Section */}
                {submissions.length > 0 && (
                  <div className="pt-4 border-t border-slate-200 space-y-2">
                    <h4 className="font-bold text-slate-800">Faculty Test Submissions ({submissions.length})</h4>
                    <div className="border border-slate-200 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                          <tr>
                            <th className="py-2.5 px-3">Faculty</th>
                            <th className="py-2.5 px-3">Score</th>
                            <th className="py-2.5 px-3">Status</th>
                            <th className="py-2.5 px-3">Submitted</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {submissions.map((s) => (
                            <tr key={s._id} className="hover:bg-slate-50">
                              <td className="py-2 px-3 font-semibold text-slate-800">{s.userId?.name || 'Faculty'}</td>
                              <td className="py-2 px-3 font-extrabold text-blue-700">{s.percentageScore}%</td>
                              <td className="py-2 px-3">
                                <Badge variant={s.passed ? 'success' : 'danger'}>
                                  {s.passed ? 'Passed ✓' : 'Failed ✗'}
                                </Badge>
                              </td>
                              <td className="py-2 px-3 text-slate-500">{new Date(s.submittedAt).toLocaleDateString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </Modal>
  );
};
