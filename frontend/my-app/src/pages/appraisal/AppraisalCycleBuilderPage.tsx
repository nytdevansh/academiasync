import React, { useEffect, useState } from 'react';
import {
  ClipboardList, Plus, Edit2, CheckCircle2, Clock,
  Calendar, AlertTriangle, Layers, Trash2, Shield, ArrowRight
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { FormField } from '../../components/ui/FormField';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { getCycles, createCycle, updateCycle } from '../../api/appraisals';
import { getAllDepartments } from '../../api/departments';
import type { AppraisalCycle, AppraisalCriterion, Department } from '../../types';

export const AppraisalCycleBuilderPage: React.FC = () => {
  const [cycles, setCycles] = useState<AppraisalCycle[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCycle, setEditingCycle] = useState<AppraisalCycle | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Status Change Confirmation Modal
  const [statusConfirmModal, setStatusConfirmModal] = useState<{
    cycle: AppraisalCycle;
    newStatus: 'draft' | 'active' | 'closed';
  } | null>(null);
  const [statusUpdating, setStatusUpdating] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [academicYear, setAcademicYear] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [submissionDeadline, setSubmissionDeadline] = useState('');
  const [status, setStatus] = useState<'draft' | 'active' | 'closed'>('draft');
  const [selectedDeptIds, setSelectedDeptIds] = useState<string[]>([]);
  const [criteria, setCriteria] = useState<AppraisalCriterion[]>([
    { name: 'Teaching Quality & Curriculum Delivery', description: 'Student feedback, course files, pedagogy', maxScore: 40, weight: 40 },
    { name: 'Research Publications & Sponsored Grants', description: 'SCI/Scopus journals, citations, grant funding', maxScore: 30, weight: 30 },
    { name: 'Institutional Governance & Accreditation', description: 'NBA/NAAC committees, cell coordination', maxScore: 20, weight: 20 },
    { name: 'Professional Development & FDPs', description: 'FDP attendances, industry certs, workshops', maxScore: 10, weight: 10 },
  ]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [cyclesRes, deptsRes] = await Promise.all([getCycles(), getAllDepartments()]);
      if (cyclesRes.success) setCycles(cyclesRes.data || []);
      if (deptsRes.success) setDepartments(deptsRes.data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load appraisal cycles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalWeight = criteria.reduce((sum, c) => sum + (Number(c.weight) || 0), 0);
  const isWeightValid = totalWeight === 100;

  const handleOpenCreateModal = () => {
    setEditingCycle(null);
    setTitle('');
    setAcademicYear(`${new Date().getFullYear()}-${new Date().getFullYear() + 1}`);
    setStartDate(new Date().toISOString().split('T')[0]);
    setEndDate(new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0]);
    setSubmissionDeadline(new Date(Date.now() + 60 * 86400000).toISOString().split('T')[0]);
    setStatus('draft');
    setSelectedDeptIds([]);
    setCriteria([
      { name: 'Teaching Quality & Pedagogy', description: 'Student feedback, course files, LMS usage', maxScore: 40, weight: 40 },
      { name: 'Research, Grants & Publications', description: 'Indexed journals, patents, funding grants', maxScore: 30, weight: 30 },
      { name: 'Institutional & Department Service', description: 'Accreditation, committee membership, events', maxScore: 20, weight: 20 },
      { name: 'Continuous Skill Enhancement', description: 'FDPs, MOOCs, industry certifications', maxScore: 10, weight: 10 },
    ]);
    setError(null);
    setModalOpen(true);
  };

  const handleOpenEditModal = (cycle: AppraisalCycle) => {
    setEditingCycle(cycle);
    setTitle(cycle.title);
    setAcademicYear(cycle.academicYear);
    setStartDate(cycle.startDate ? new Date(cycle.startDate).toISOString().split('T')[0] : '');
    setEndDate(cycle.endDate ? new Date(cycle.endDate).toISOString().split('T')[0] : '');
    setSubmissionDeadline(cycle.submissionDeadline ? new Date(cycle.submissionDeadline).toISOString().split('T')[0] : '');
    setStatus(cycle.status);
    setSelectedDeptIds(cycle.targetDepartments?.map((d: any) => typeof d === 'string' ? d : d._id) || []);
    setCriteria(cycle.criteria && cycle.criteria.length > 0 ? cycle.criteria : [
      { name: 'Criterion 1', description: '', maxScore: 50, weight: 50 },
      { name: 'Criterion 2', description: '', maxScore: 50, weight: 50 },
    ]);
    setError(null);
    setModalOpen(true);
  };

  const handleAddCriterion = () => {
    setCriteria(prev => [
      ...prev,
      { name: '', description: '', maxScore: 20, weight: 0 }
    ]);
  };

  const handleRemoveCriterion = (index: number) => {
    setCriteria(prev => prev.filter((_, i) => i !== index));
  };

  const handleCriterionChange = (index: number, field: keyof AppraisalCriterion, val: any) => {
    setCriteria(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: val };
      return updated;
    });
  };

  const handleSaveCycle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !academicYear.trim() || !startDate || !endDate || !submissionDeadline) {
      setError('Please fill in all required title, academic year, and date fields.');
      return;
    }

    if (!isWeightValid) {
      setError(`Criteria weights must sum to exactly 100%. Current total: ${totalWeight}%`);
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const payload: any = {
        title,
        academicYear,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        submissionDeadline: new Date(submissionDeadline),
        status,
        targetDepartments: selectedDeptIds,
        criteria: criteria.map(c => ({
          name: c.name,
          description: c.description || '',
          maxScore: Number(c.maxScore) || 10,
          weight: Number(c.weight) || 0,
        })),
      };

      if (editingCycle) {
        await updateCycle(editingCycle._id, payload);
      } else {
        await createCycle(payload);
      }

      setModalOpen(false);
      await loadData();
    } catch (err: any) {
      setError(err?.response?.data?.error || err.message || 'Failed to save appraisal cycle');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusTransition = async () => {
    if (!statusConfirmModal) return;
    setStatusUpdating(true);
    try {
      await updateCycle(statusConfirmModal.cycle._id, { status: statusConfirmModal.newStatus });
      setStatusConfirmModal(null);
      await loadData();
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Failed to update cycle status');
    } finally {
      setStatusUpdating(false);
    }
  };

  if (loading) return <LoadingSpinner text="Loading appraisal cycles..." />;

  const activeCycles = cycles.filter(c => c.status === 'active');
  const draftCycles = cycles.filter(c => c.status === 'draft');
  const closedCycles = cycles.filter(c => c.status === 'closed');

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Appraisal Cycles Configuration</h1>
          <p className="text-xs font-medium text-slate-500 mt-1">
            Configure institutional faculty evaluation windows, criteria weightages, and submission deadlines
          </p>
        </div>
        <Button variant="primary" icon={<Plus className="w-4 h-4" />} onClick={handleOpenCreateModal}>
          Create Appraisal Cycle
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 flex items-center gap-3 border-slate-200">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200/70 flex items-center justify-center text-blue-600">
            <ClipboardList className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-slate-900">{cycles.length}</div>
            <div className="text-xs font-medium text-slate-500">Total Defined Cycles</div>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3 border-emerald-200 bg-emerald-50/20">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-emerald-700">{activeCycles.length}</div>
            <div className="text-xs font-medium text-emerald-600">Active Submission Windows</div>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3 border-slate-200">
          <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-slate-900">{draftCycles.length} Draft • {closedCycles.length} Closed</div>
            <div className="text-xs font-medium text-slate-500">Cycle Status Breakdown</div>
          </div>
        </Card>
      </div>

      {/* Cycles Roster */}
      {cycles.length === 0 ? (
        <EmptyState
          title="No Appraisal Cycles Defined"
          description="Create your first faculty appraisal cycle to begin scheduled annual assessments."
          action={<Button variant="primary" onClick={handleOpenCreateModal}>Create Cycle</Button>}
        />
      ) : (
        <div className="space-y-4">
          {cycles.map(cycle => (
            <Card key={cycle._id} className="p-5 space-y-4 border-slate-200 shadow-2xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2.5">
                    <h3 className="text-base font-bold text-slate-900">{cycle.title}</h3>
                    <Badge variant={cycle.status === 'active' ? 'success' : cycle.status === 'draft' ? 'warning' : 'muted'}>
                      {cycle.status.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="text-xs font-medium text-blue-600 mt-0.5">
                    Academic Year: {cycle.academicYear}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {cycle.status === 'draft' && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-emerald-700 border-emerald-300 hover:bg-emerald-50"
                      onClick={() => setStatusConfirmModal({ cycle, newStatus: 'active' })}
                    >
                      Activate Window
                    </Button>
                  )}
                  {cycle.status === 'active' && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-amber-700 border-amber-300 hover:bg-amber-50"
                      onClick={() => setStatusConfirmModal({ cycle, newStatus: 'closed' })}
                    >
                      Close Window
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    icon={<Edit2 className="w-3.5 h-3.5" />}
                    onClick={() => handleOpenEditModal(cycle)}
                  >
                    Edit
                  </Button>
                </div>
              </div>

              {/* Window Dates & Department Info */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="flex items-center gap-2 text-slate-600">
                  <Calendar className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span>Cycle: {new Date(cycle.startDate).toLocaleDateString()} – {new Date(cycle.endDate).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>Deadline: <strong className="text-slate-800">{new Date(cycle.submissionDeadline).toLocaleDateString()}</strong></span>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <Layers className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                  <span>
                    Scope: {cycle.targetDepartments && cycle.targetDepartments.length > 0
                      ? `${cycle.targetDepartments.length} Departments`
                      : 'All Academic Departments'}
                  </span>
                </div>
              </div>

              {/* Criteria Summary Pills */}
              <div className="pt-2 border-t border-slate-100">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Appraisal Criteria Rubric ({cycle.criteria?.length || 0} Dimensions)
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                  {cycle.criteria?.map((cr, idx) => (
                    <div key={idx} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 text-xs space-y-1">
                      <div className="font-bold text-slate-800 truncate" title={cr.name}>{cr.name}</div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span>Max: {cr.maxScore} pts</span>
                        <span className="font-semibold text-blue-600">Weight: {cr.weight}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create / Edit Cycle Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingCycle ? `Edit Cycle: ${editingCycle.title}` : 'Create New Appraisal Cycle'}
        size="xl"
      >
        <form onSubmit={handleSaveCycle} className="space-y-5">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Cycle Title" required>
              <input
                type="text"
                required
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Annual Faculty Appraisal 2025-2026"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
            </FormField>

            <FormField label="Academic Year" required>
              <input
                type="text"
                required
                value={academicYear}
                onChange={e => setAcademicYear(e.target.value)}
                placeholder="2025-2026"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
            </FormField>

            <FormField label="Start Date" required>
              <input
                type="date"
                required
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
            </FormField>

            <FormField label="End Date" required>
              <input
                type="date"
                required
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
            </FormField>

            <FormField label="Faculty Submission Deadline" required>
              <input
                type="date"
                required
                value={submissionDeadline}
                onChange={e => setSubmissionDeadline(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
            </FormField>

            <FormField label="Lifecycle Status" required>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as any)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              >
                <option value="draft">Draft (Planning)</option>
                <option value="active">Active (Open for Submissions)</option>
                <option value="closed">Closed (Completed)</option>
              </select>
            </FormField>
          </div>

          {/* Department Scope */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Target Academic Departments</label>
            <p className="text-[11px] text-slate-500">Leave unselected to apply institution-wide across all departments.</p>
            <div className="max-h-28 overflow-y-auto p-2 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-2 gap-2 text-xs">
              {departments.map(dept => (
                <label key={dept._id} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedDeptIds.includes(dept._id)}
                    onChange={e => {
                      if (e.target.checked) {
                        setSelectedDeptIds(prev => [...prev, dept._id]);
                      } else {
                        setSelectedDeptIds(prev => prev.filter(id => id !== dept._id));
                      }
                    }}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span className="truncate">{dept.code} – {dept.name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Dynamic Criteria Rubric Builder */}
          <div className="space-y-3 pt-3 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Appraisal Criteria & Weightages
                </h4>
                <p className="text-[11px] text-slate-500">
                  Total weight of all criteria must equal 100%.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Badge variant={isWeightValid ? 'success' : 'danger'}>
                  Total Weight: {totalWeight}% {isWeightValid ? '✓' : '(Must be 100%)'}
                </Badge>
                <Button type="button" variant="outline" size="sm" icon={<Plus className="w-3.5 h-3.5" />} onClick={handleAddCriterion}>
                  Add Criterion
                </Button>
              </div>
            </div>

            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {criteria.map((c, idx) => (
                <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-700">Criterion #{idx + 1}</span>
                    {criteria.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveCriterion(idx)}
                        className="text-slate-400 hover:text-rose-600 transition-colors"
                        title="Remove criterion"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                    <div className="sm:col-span-5">
                      <input
                        type="text"
                        required
                        placeholder="Criterion Name"
                        value={c.name}
                        onChange={e => handleCriterionChange(idx, 'name', e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
                      />
                    </div>
                    <div className="sm:col-span-3">
                      <input
                        type="text"
                        placeholder="Description / Guide"
                        value={c.description || ''}
                        onChange={e => handleCriterionChange(idx, 'description', e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-slate-400">Max:</span>
                        <input
                          type="number"
                          min={1}
                          required
                          value={c.maxScore}
                          onChange={e => handleCriterionChange(idx, 'maxScore', Number(e.target.value))}
                          className="w-full px-2 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
                        />
                      </div>
                    </div>
                    <div className="sm:col-span-2">
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-slate-400">Wt%:</span>
                        <input
                          type="number"
                          min={0}
                          max={100}
                          required
                          value={c.weight}
                          onChange={e => handleCriterionChange(idx, 'weight', Number(e.target.value))}
                          className="w-full px-2 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={submitting}
              disabled={!isWeightValid}
            >
              {editingCycle ? 'Save Cycle Changes' : 'Create Appraisal Cycle'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Confirmation Modal for Status Transition */}
      <Modal
        open={!!statusConfirmModal}
        onClose={() => setStatusConfirmModal(null)}
        title="Confirm Cycle Status Transition"
        size="sm"
      >
        <div className="space-y-4">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 space-y-1">
            <div className="font-bold flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              Transitioning Cycle Status to {statusConfirmModal?.newStatus.toUpperCase()}
            </div>
            <p>
              {statusConfirmModal?.newStatus === 'active'
                ? 'Activating this cycle will open the submission window, allowing faculty to submit self-assessments.'
                : 'Closing this cycle will freeze faculty submissions and conclude the evaluation period.'}
            </p>
          </div>

          <p className="text-xs text-slate-600">
            Target Cycle: <strong className="text-slate-900">{statusConfirmModal?.cycle.title}</strong>
          </p>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
            <Button variant="ghost" size="sm" onClick={() => setStatusConfirmModal(null)}>Cancel</Button>
            <Button
              variant="primary"
              size="sm"
              loading={statusUpdating}
              onClick={handleStatusTransition}
            >
              Confirm Transition
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
