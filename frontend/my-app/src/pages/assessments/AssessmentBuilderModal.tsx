import React, { useState, useEffect } from 'react';
import {
  Plus,
  Trash2,
  HelpCircle,
  Clock,
  Calendar,
  Layers,
  Award,
  Lock,
  EyeOff,
  CheckCircle2,
  Sparkles,
  Bookmark,
} from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { FormField } from '../../components/ui/FormField';
import { Badge } from '../../components/ui/Badge';
import { getDepartments } from '../../api/departments';
import { getSkillAreas } from '../../api/competency';
import { useAuth } from '../../context/AuthContext';
import { ASSESSMENT_TOPICS } from '../../utils/constants';
import type {
  Assessment,
  AssessmentQuestion,
  AssessmentQuestionType,
  Department,
  SkillArea,
} from '../../types';

interface AssessmentBuilderModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: Partial<Assessment>) => Promise<void>;
  initialData?: Partial<Assessment> | null;
}

export const AssessmentBuilderModal: React.FC<AssessmentBuilderModalProps> = ({
  open,
  onClose,
  onSave,
  initialData,
}) => {
  const { user } = useAuth();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [skillAreas, setSkillAreas] = useState<SkillArea[]>([]);
  const [saving, setSaving] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [topic, setTopic] = useState('AI & Pedagogy');
  const [scopeType, setScopeType] = useState<'all' | 'department' | 'individual' | 'role'>('all');
  const [selectedDeptIds, setSelectedDeptIds] = useState<string[]>([]);
  const [isGraded, setIsGraded] = useState(true);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [allowRetake, setAllowRetake] = useState(false);
  const [maxAttempts, setMaxAttempts] = useState(1);
  const [timeLimitMinutes, setTimeLimitMinutes] = useState<number | ''>(20);
  const [dueDate, setDueDate] = useState('');
  const [isTemplate, setIsTemplate] = useState(false);
  const [status, setStatus] = useState<'draft' | 'published'>('published');

  // Question List State
  const [questions, setQuestions] = useState<AssessmentQuestion[]>([
    {
      prompt: '',
      type: 'mcq',
      options: ['Option A', 'Option B', 'Option C', 'Option D'],
      correctAnswer: 0,
      points: 2,
    },
  ]);

  useEffect(() => {
    if (open) {
      getDepartments().then((res: any) => {
        if (res.success && res.data) setDepartments(res.data);
      });
      getSkillAreas().then((res: any) => {
        if (res.success && res.data) setSkillAreas(res.data);
      });

      if (initialData) {
        setTitle(initialData.title || '');
        setDescription(initialData.description || '');
        setTopic(initialData.topic || 'General');
        setScopeType(initialData.targetScope?.type || 'all');
        setSelectedDeptIds(
          (initialData.targetScope?.targetIds || []).map((d: any) => d._id || d)
        );
        setIsGraded(initialData.settings?.isGraded ?? true);
        setIsAnonymous(initialData.settings?.isAnonymous ?? false);
        setAllowRetake(initialData.settings?.allowRetake ?? false);
        setMaxAttempts(initialData.settings?.maxAttempts || 1);
        setTimeLimitMinutes(initialData.settings?.timeLimitMinutes || '');
        setDueDate(initialData.settings?.dueDate ? initialData.settings.dueDate.split('T')[0] : '');
        setIsTemplate(Boolean(initialData.isTemplate));
        setStatus(initialData.status === 'published' ? 'published' : 'draft');
        if (initialData.questions && initialData.questions.length > 0) {
          setQuestions(initialData.questions);
        }
      } else {
        // Reset defaults
        setTitle('');
        setDescription('');
        setTopic('General');
        if (user?.role === 'hod' && user.department) {
          setScopeType('department');
          setSelectedDeptIds([user.department._id || (user.department as any)]);
        } else {
          setScopeType('all');
          setSelectedDeptIds([]);
        }
        setIsGraded(true);
        setIsAnonymous(false);
        setAllowRetake(false);
        setMaxAttempts(1);
        setTimeLimitMinutes(20);
        setDueDate('');
        setIsTemplate(false);
        setStatus('published');
        setQuestions([
          {
            prompt: '',
            type: 'mcq',
            options: ['Option A', 'Option B', 'Option C', 'Option D'],
            correctAnswer: 0,
            points: 2,
          },
        ]);
      }
    }
  }, [open, initialData, user]);

  const addQuestion = (type: AssessmentQuestionType) => {
    let newQ: AssessmentQuestion = {
      prompt: '',
      type,
      points: isGraded ? (type === 'rating' ? 0 : 2) : 0,
    };

    if (type === 'mcq') {
      newQ.options = ['Option A', 'Option B', 'Option C', 'Option D'];
      newQ.correctAnswer = 0;
    } else if (type === 'boolean') {
      newQ.correctAnswer = true;
    }

    setQuestions([...questions, newQ]);
  };

  const updateQuestion = (index: number, patch: Partial<AssessmentQuestion>) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], ...patch };
    setQuestions(updated);
  };

  const removeQuestion = (index: number) => {
    if (questions.length === 1) return;
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleOptionChange = (qIndex: number, optIndex: number, val: string) => {
    const q = questions[qIndex];
    const newOptions = [...(q.options || [])];
    newOptions[optIndex] = val;
    updateQuestion(qIndex, { options: newOptions });
  };

  const addOption = (qIndex: number) => {
    const q = questions[qIndex];
    const newOptions = [...(q.options || []), `Option ${(q.options?.length || 0) + 1}`];
    updateQuestion(qIndex, { options: newOptions });
  };

  const removeOption = (qIndex: number, optIndex: number) => {
    const q = questions[qIndex];
    if (!q.options || q.options.length <= 2) return;
    const newOptions = q.options.filter((_, idx) => idx !== optIndex);
    let newCorrect = q.correctAnswer;
    if (newCorrect === optIndex) newCorrect = 0;
    else if (newCorrect > optIndex) newCorrect = newCorrect - 1;
    updateQuestion(qIndex, { options: newOptions, correctAnswer: newCorrect });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Please enter an assessment title.');
      return;
    }
    const hasEmptyPrompt = questions.some(q => !q.prompt.trim());
    if (hasEmptyPrompt) {
      alert('Please make sure all question prompts are filled out.');
      return;
    }

    setSaving(true);
    try {
      const payload: Partial<Assessment> = {
        title: title.trim(),
        description: description.trim(),
        topic,
        targetScope: {
          type: scopeType,
          targetIds: scopeType === 'department' ? selectedDeptIds : undefined,
        },
        settings: {
          isGraded,
          isAnonymous,
          allowRetake,
          maxAttempts: Number(maxAttempts) || 1,
          timeLimitMinutes: timeLimitMinutes ? Number(timeLimitMinutes) : undefined,
          dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
        },
        questions,
        status,
        isTemplate,
      };

      await onSave(payload);
      onClose();
    } catch (err: any) {
      alert(err.response?.data?.error || err.message || 'Failed to save assessment');
    } finally {
      setSaving(false);
    }
  };

  const totalPoints = questions.reduce((sum, q) => sum + (isGraded ? (q.points || 0) : 0), 0);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initialData ? 'Edit Assessment / Survey' : 'Create Custom Assessment or Survey'}
      size="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
          <div className="md:col-span-8">
            <FormField label="Assessment Title" required>
              <input
                type="text"
                className="input"
                placeholder="e.g. Outcome-Based AI Pedagogy & Viva Evaluation"
                value={title}
                onChange={e => setTitle(e.target.value)}
                required
              />
            </FormField>
          </div>
          <div className="md:col-span-4">
            <FormField label="Topic / Category" required>
              <select
                className="input"
                value={topic}
                onChange={e => setTopic(e.target.value)}
              >
                {ASSESSMENT_TOPICS.map(t => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </FormField>
          </div>
          <div className="md:col-span-12">
            <FormField label="Description & Context">
              <textarea
                className="input min-h-[60px]"
                rows={2}
                placeholder="Explain the purpose, syllabus alignment, or survey goals..."
                value={description}
                onChange={e => setDescription(e.target.value)}
              />
            </FormField>
          </div>
        </div>

        {/* Scope & Scheduling */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField label="Target Audience">
            <select
              className="input"
              value={scopeType}
              onChange={e => setScopeType(e.target.value as any)}
              disabled={user?.role === 'hod'}
            >
              <option value="all">Campus-Wide (All Faculty)</option>
              <option value="department">Specific Department</option>
              <option value="role">All Regular Faculty</option>
            </select>
          </FormField>

          {scopeType === 'department' && (
            <FormField label="Select Department">
              <select
                className="input"
                value={selectedDeptIds[0] || ''}
                onChange={e => setSelectedDeptIds([e.target.value])}
                disabled={user?.role === 'hod'}
              >
                <option value="">Choose department...</option>
                {departments.map(d => (
                  <option key={d._id} value={d._id}>
                    {d.name} ({d.code})
                  </option>
                ))}
              </select>
            </FormField>
          )}

          <FormField label="Due Date (Optional)">
            <input
              type="date"
              className="input"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
            />
          </FormField>

          <FormField label="Time Limit (Minutes)">
            <div className="relative">
              <input
                type="number"
                min={1}
                max={300}
                className="input pl-9"
                placeholder="Leave blank for untimed"
                value={timeLimitMinutes}
                onChange={e => setTimeLimitMinutes(e.target.value === '' ? '' : Number(e.target.value))}
              />
              <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </FormField>
        </div>

        {/* Engine Settings Toggles */}
        <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            Assessment Engine Configuration
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            {/* Graded Toggle */}
            <label className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-50 border border-slate-200/80 cursor-pointer hover:bg-slate-100 transition-colors">
              <input
                type="checkbox"
                checked={isGraded}
                onChange={e => setIsGraded(e.target.checked)}
                className="rounded text-blue-600 focus:ring-blue-500"
              />
              <div>
                <div className="font-semibold text-slate-900 text-xs">Graded Test</div>
                <div className="text-[11px] text-slate-500">Auto-scores MCQ & Boolean</div>
              </div>
            </label>

            {/* Anonymous Toggle */}
            <label className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-50 border border-slate-200/80 cursor-pointer hover:bg-slate-100 transition-colors">
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={e => setIsAnonymous(e.target.checked)}
                className="rounded text-blue-600 focus:ring-blue-500"
              />
              <div>
                <div className="font-semibold text-slate-900 text-xs flex items-center gap-1">
                  Anonymous <EyeOff className="w-3 h-3 text-slate-400" />
                </div>
                <div className="text-[11px] text-slate-500">Redacts faculty names</div>
              </div>
            </label>

            {/* Retake Toggle */}
            <label className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-50 border border-slate-200/80 cursor-pointer hover:bg-slate-100 transition-colors">
              <input
                type="checkbox"
                checked={allowRetake}
                onChange={e => setAllowRetake(e.target.checked)}
                className="rounded text-blue-600 focus:ring-blue-500"
              />
              <div>
                <div className="font-semibold text-slate-900 text-xs">Allow Retakes</div>
                <div className="text-[11px] text-slate-500">Track multi-attempt progression</div>
              </div>
            </label>

            {/* Template Toggle */}
            <label className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-50 border border-slate-200/80 cursor-pointer hover:bg-slate-100 transition-colors">
              <input
                type="checkbox"
                checked={isTemplate}
                onChange={e => setIsTemplate(e.target.checked)}
                className="rounded text-blue-600 focus:ring-blue-500"
              />
              <div>
                <div className="font-semibold text-slate-900 text-xs flex items-center gap-1">
                  Save Template <Bookmark className="w-3 h-3 text-amber-500" />
                </div>
                <div className="text-[11px] text-slate-500">Reusable across terms</div>
              </div>
            </label>
          </div>
        </div>

        {/* Question Builder */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2">
            <div>
              <h4 className="font-bold text-slate-900 text-base">Question Set ({questions.length})</h4>
              <p className="text-xs text-slate-500">
                {isGraded ? `Total Maximum Points: ${totalPoints}` : 'Survey / Feedback Mode'}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs text-slate-500 mr-1 hidden sm:inline">Add Question:</span>
              <Button type="button" size="sm" variant="secondary" onClick={() => addQuestion('mcq')}>
                + MCQ
              </Button>
              <Button type="button" size="sm" variant="secondary" onClick={() => addQuestion('boolean')}>
                + True/False
              </Button>
              <Button type="button" size="sm" variant="secondary" onClick={() => addQuestion('rating')}>
                + 1-5 Rating
              </Button>
              <Button type="button" size="sm" variant="secondary" onClick={() => addQuestion('text')}>
                + Text
              </Button>
            </div>
          </div>

          <div className="space-y-4 max-h-[480px] overflow-y-auto pr-1">
            {questions.map((q, qIndex) => (
              <div
                key={qIndex}
                className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-3 relative group"
              >
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
                      {qIndex + 1}
                    </span>
                    <Badge variant={q.type === 'mcq' ? 'teal' : q.type === 'boolean' ? 'info' : q.type === 'rating' ? 'gold' : 'violet'}>
                      {q.type.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    {isGraded && q.type !== 'rating' && (
                      <div className="flex items-center gap-1 text-xs">
                        <span className="text-slate-500">Points:</span>
                        <input
                          type="number"
                          min={0}
                          max={50}
                          className="w-14 px-2 py-1 border border-slate-300 rounded text-center text-xs font-bold"
                          value={q.points ?? 1}
                          onChange={e => updateQuestion(qIndex, { points: Number(e.target.value) })}
                        />
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => removeQuestion(qIndex)}
                      className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Delete question"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Prompt */}
                <FormField label="Question Prompt" required>
                  <input
                    type="text"
                    className="input font-medium"
                    placeholder="Enter question text..."
                    value={q.prompt}
                    onChange={e => updateQuestion(qIndex, { prompt: e.target.value })}
                    required
                  />
                </FormField>

                {/* Question Type Specific Controls */}
                {q.type === 'mcq' && (
                  <div className="space-y-2 pl-2 border-l-2 border-blue-200">
                    <div className="text-xs font-semibold text-slate-600 mb-1">
                      Options (Select the correct answer radio button):
                    </div>
                    {(q.options || []).map((opt, optIndex) => (
                      <div key={optIndex} className="flex items-center gap-2">
                        <input
                          type="radio"
                          name={`correct_${qIndex}`}
                          checked={Number(q.correctAnswer) === optIndex}
                          onChange={() => updateQuestion(qIndex, { correctAnswer: optIndex })}
                          className="text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                        <input
                          type="text"
                          className="input flex-1 text-xs py-1.5"
                          value={opt}
                          onChange={e => handleOptionChange(qIndex, optIndex, e.target.value)}
                          placeholder={`Option ${optIndex + 1}`}
                          required
                        />
                        {(q.options?.length || 0) > 2 && (
                          <button
                            type="button"
                            onClick={() => removeOption(qIndex, optIndex)}
                            className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                    {(q.options?.length || 0) < 6 && (
                      <button
                        type="button"
                        onClick={() => addOption(qIndex)}
                        className="text-xs text-blue-600 font-semibold hover:underline mt-1 flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add Option
                      </button>
                    )}
                  </div>
                )}

                {q.type === 'boolean' && (
                  <div className="flex items-center gap-4 pl-2 border-l-2 border-blue-200">
                    <span className="text-xs font-semibold text-slate-600">Correct Answer:</span>
                    <label className="flex items-center gap-1 text-xs font-medium cursor-pointer">
                      <input
                        type="radio"
                        name={`bool_${qIndex}`}
                        checked={q.correctAnswer === true}
                        onChange={() => updateQuestion(qIndex, { correctAnswer: true })}
                        className="text-blue-600"
                      />
                      True
                    </label>
                    <label className="flex items-center gap-1 text-xs font-medium cursor-pointer">
                      <input
                        type="radio"
                        name={`bool_${qIndex}`}
                        checked={q.correctAnswer === false}
                        onChange={() => updateQuestion(qIndex, { correctAnswer: false })}
                        className="text-blue-600"
                      />
                      False
                    </label>
                  </div>
                )}

                {q.type === 'rating' && (
                  <div className="p-2.5 rounded-lg bg-amber-50/60 border border-amber-200/60 text-xs text-amber-900 flex items-center justify-between">
                    <span>1 to 5 Likert Scale (Poor / Needs Improvement / Neutral / Good / Excellent)</span>
                    <span className="font-semibold text-amber-700">Survey Metric</span>
                  </div>
                )}

                {q.type === 'text' && (
                  <div className="space-y-2">
                    <FormField label="Grading Rubric / Evaluator Guidelines (Optional)">
                      <input
                        type="text"
                        className="input text-xs"
                        placeholder="What specific criteria should the reviewer look for?"
                        value={q.rubricGuide || ''}
                        onChange={e => updateQuestion(qIndex, { rubricGuide: e.target.value })}
                      />
                    </FormField>
                  </div>
                )}

                {/* Optional Skill Area / Competency Tagging */}
                {skillAreas.length > 0 && (
                  <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                    <Award className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-[11px] text-slate-500">Link to Skill Area:</span>
                    <select
                      className="text-xs border border-slate-200 rounded px-2 py-1 bg-slate-50 text-slate-700 max-w-xs"
                      value={q.competencyId ? (typeof q.competencyId === 'object' ? (q.competencyId as any)._id : q.competencyId) : ''}
                      onChange={e => updateQuestion(qIndex, { competencyId: e.target.value || undefined })}
                    >
                      <option value="">None (Standalone Question)</option>
                      {skillAreas.map(s => (
                        <option key={s._id} value={s._id}>
                          {s.name} ({s.category})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-slate-200">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto">
            <span className="text-xs text-slate-500 whitespace-nowrap">Publish Mode:</span>
            <select
              className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white font-medium text-slate-700 w-full sm:w-auto"
              value={status}
              onChange={e => setStatus(e.target.value as any)}
            >
              <option value="published">Publish Immediately (Dispatches Notifications)</option>
              <option value="draft">Save as Draft (Private)</option>
            </select>
          </div>
          <div className="flex items-center justify-end gap-2 w-full sm:w-auto">
            <Button type="button" variant="secondary" onClick={onClose} disabled={saving} className="flex-1 sm:flex-none">
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={saving} className="flex-1 sm:flex-none">
              {status === 'published' ? 'Publish Assessment' : 'Save Draft'}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
