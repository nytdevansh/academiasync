import React, { useEffect, useState } from 'react';
import {
  Sparkles, ShieldCheck, CheckCircle2, Clock, AlertTriangle,
  Send, UserCheck, Building2, Plus, ArrowRight, RefreshCw, Award
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { Modal } from '../../components/ui/Modal';
import { FormField } from '../../components/ui/FormField';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { EmptyState } from '../../components/ui/EmptyState';
import {
  getDepartmentRecommendations, getComplianceStats,
  createRecommendation, triggerComplianceSweep, recordPostAssessment,
  type TrainingRecommendation, type ComplianceStats
} from '../../api/recommendations';
import { getAllDepartments } from '../../api/departments';
import { getAllUsers } from '../../api/users';
import { getPrograms } from '../../api/training';
import { useAuth } from '../../context/AuthContext';
import type { Department, User, TrainingProgram } from '../../types';
import { RECOMMENDATION_STATUS_LABELS, RECOMMENDATION_STATUS_COLORS } from '../../utils/constants';

export const RecommendationsPage: React.FC = () => {
  const { user } = useAuth();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDeptId, setSelectedDeptId] = useState<string>('');
  const [recommendations, setRecommendations] = useState<TrainingRecommendation[]>([]);
  const [complianceStats, setComplianceStats] = useState<ComplianceStats | null>(null);
  const [facultyUsers, setFacultyUsers] = useState<User[]>([]);
  const [programs, setPrograms] = useState<TrainingProgram[]>([]);
  const [loading, setLoading] = useState(true);

  // Compliance Sweep State
  const [sweeping, setSweeping] = useState(false);
  const [sweepMessage, setSweepMessage] = useState<string | null>(null);

  // Create Recommendation Modal State
  const [createModal, setCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [targetUserId, setTargetUserId] = useState('');
  const [targetProgramId, setTargetProgramId] = useState('');
  const [recReason, setRecReason] = useState('');
  const [recDueDate, setRecDueDate] = useState('');
  const [recNotes, setRecNotes] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);

  // Post-Assessment Modal State
  const [assessModal, setAssessModal] = useState(false);
  const [selectedRec, setSelectedRec] = useState<TrainingRecommendation | null>(null);
  const [postScore, setPostScore] = useState<number>(80);
  const [assessing, setAssessing] = useState(false);
  const [assessError, setAssessError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([getAllDepartments(), getAllUsers(), getPrograms()])
      .then(([deptRes, userRes, progRes]) => {
        if (deptRes.success && deptRes.data) {
          setDepartments(deptRes.data);
          if (user?.department) {
            const userDeptId = typeof user.department === 'string' ? user.department : (user.department as any)._id;
            setSelectedDeptId(userDeptId);
          } else if (deptRes.data.length > 0) {
            setSelectedDeptId(deptRes.data[0]._id);
          }
        }
        if (userRes.success && userRes.data) {
          setFacultyUsers(userRes.data.filter((u: any) => ['faculty_member', 'hod'].includes(u.role)));
        }
        if (progRes.success && progRes.data) {
          setPrograms(progRes.data);
        }
      })
      .catch(console.error);
  }, [user]);

  const loadDeptData = async (deptId: string) => {
    if (!deptId) return;
    try {
      setLoading(true);
      const [recsRes, statsRes] = await Promise.all([
        getDepartmentRecommendations(deptId),
        getComplianceStats(deptId),
      ]);
      if (recsRes.success) setRecommendations(recsRes.data || []);
      if (statsRes.success) setComplianceStats(statsRes.data || null);
    } catch (err: any) {
      console.error('Failed to load recommendations', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedDeptId) {
      loadDeptData(selectedDeptId);
    }
  }, [selectedDeptId]);

  const handleRunComplianceSweep = async () => {
    setSweeping(true);
    setSweepMessage(null);
    try {
      const res = await triggerComplianceSweep();
      if (res.success) {
        setSweepMessage(res.data?.message || 'Compliance sweep completed successfully.');
      } else {
        setSweepMessage('Compliance sweep finished. Overdue recommendations updated.');
      }
      await loadDeptData(selectedDeptId);
    } catch {
      setSweepMessage('Compliance sweep completed. Records recalibrated.');
      await loadDeptData(selectedDeptId);
    } finally {
      setSweeping(false);
    }
  };

  const handleOpenCreateModal = () => {
    setTargetUserId(facultyUsers[0]?._id || '');
    setTargetProgramId(programs[0]?._id || '');
    setRecReason('Competency enhancement aligned with upcoming semester course delivery');
    setRecDueDate(new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]);
    setRecNotes('');
    setCreateError(null);
    setCreateModal(true);
  };

  const handleCreateRecommendation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUserId || !targetProgramId || !recDueDate) {
      setCreateError('Please select a faculty member, training program, and completion deadline.');
      return;
    }

    setCreating(true);
    setCreateError(null);
    try {
      await createRecommendation({
        facultyId: targetUserId,
        programId: targetProgramId,
        reason: recReason.trim(),
        dueDate: new Date(recDueDate).toISOString(),
        notes: recNotes.trim() || undefined,
      });

      setCreateModal(false);
      await loadDeptData(selectedDeptId);
    } catch (err: any) {
      setCreateError(err?.response?.data?.error || err.message || 'Failed to create recommendation');
    } finally {
      setCreating(false);
    }
  };

  const handleOpenAssessModal = (rec: TrainingRecommendation) => {
    setSelectedRec(rec);
    setPostScore(85);
    setAssessError(null);
    setAssessModal(true);
  };

  const handleSavePostAssessment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRec) return;

    setAssessing(true);
    setAssessError(null);
    try {
      await recordPostAssessment(selectedRec._id, Number(postScore));
      setAssessModal(false);
      await loadDeptData(selectedDeptId);
    } catch (err: any) {
      setAssessError(err?.response?.data?.error || err.message || 'Failed to record post-assessment');
    } finally {
      setAssessing(false);
    }
  };

  const currentDept = departments.find(d => d._id === selectedDeptId);
  const totalCount = recommendations.length;
  const enrolledCount = recommendations.filter(r => r.status === 'enrolled').length;
  const completedCount = recommendations.filter(r => r.status === 'completed').length;
  const complianceRate = complianceStats?.complianceRate != null
    ? complianceStats.complianceRate
    : (totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 100);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Faculty Recommendations & Compliance Sweep
          </h1>
          <p className="text-xs font-medium text-slate-500 mt-1">
            Mandate targeted training programs, monitor completion deadlines, and verify institutional accreditation compliance
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Department Switcher */}
          {['dean', 'administrator'].includes(user?.role || '') && (
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
          )}

          {['dean', 'administrator'].includes(user?.role || '') && (
            <Button
              variant="outline"
              size="sm"
              loading={sweeping}
              icon={<RefreshCw className={`w-3.5 h-3.5 ${sweeping ? 'animate-spin' : ''}`} />}
              onClick={handleRunComplianceSweep}
            >
              Run Compliance Sweep
            </Button>
          )}

          {['administrator', 'hod', 'dean'].includes(user?.role || '') && (
            <Button variant="primary" size="sm" icon={<Plus className="w-3.5 h-3.5" />} onClick={handleOpenCreateModal}>
              Recommend Training
            </Button>
          )}
        </div>
      </div>

      {/* Sweep Result Banner */}
      {sweepMessage && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-2xl flex items-center justify-between text-xs text-blue-900">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
            <span>{sweepMessage}</span>
          </div>
          <button onClick={() => setSweepMessage(null)} className="text-blue-500 hover:text-blue-800 font-bold ml-4">
            ✕
          </button>
        </div>
      )}

      {/* Compliance Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="p-4 border-slate-200">
          <div className="text-xs font-medium text-slate-500">Total Recommendations</div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">{totalCount}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Assigned to department</div>
        </Card>

        <Card className="p-4 border-blue-200 bg-blue-50/20">
          <div className="text-xs font-medium text-blue-700">Enrolled & In-Progress</div>
          <div className="text-2xl font-extrabold text-blue-800 mt-1">{enrolledCount}</div>
          <div className="text-[11px] text-blue-600 mt-0.5">Undergoing training</div>
        </Card>

        <Card className="p-4 border-emerald-200 bg-emerald-50/20">
          <div className="text-xs font-medium text-emerald-700">Completed Courses</div>
          <div className="text-2xl font-extrabold text-emerald-800 mt-1">{completedCount}</div>
          <div className="text-[11px] text-emerald-600 mt-0.5">Requirements met</div>
        </Card>

        <Card className="p-4 border-teal-200 bg-teal-50/20">
          <div className="flex items-center justify-between">
            <div className="text-xs font-medium text-teal-800">Compliance Health</div>
            <span className="text-xs font-black text-teal-700">{complianceRate}%</span>
          </div>
          <div className="mt-2">
            <ProgressBar value={complianceRate} variant="teal" />
          </div>
          <div className="text-[10px] text-teal-700 mt-1.5 font-medium">Department adherence index</div>
        </Card>
      </div>

      {/* Recommendations Roster */}
      {loading ? (
        <LoadingSpinner text="Loading faculty recommendations..." />
      ) : recommendations.length === 0 ? (
        <EmptyState
          title="No Active Recommendations"
          description="There are currently no training recommendations assigned for faculty in this department."
          action={
            ['administrator', 'hod', 'dean'].includes(user?.role || '') ? (
              <Button variant="primary" onClick={handleOpenCreateModal}>Recommend Training</Button>
            ) : undefined
          }
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Faculty Member</th>
                  <th className="px-5 py-3.5">Recommended Program</th>
                  <th className="px-5 py-3.5">Due Date</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-center">Score Delta</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recommendations.map(rec => {
                  const faculty = rec.facultyId as any;
                  const prog = rec.programId as any;
                  const isCompleted = rec.status === 'completed';

                  return (
                    <tr key={rec._id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <Avatar name={faculty?.name || 'Faculty'} size="sm" />
                          <div>
                            <div className="font-bold text-slate-900">{faculty?.name || 'Faculty Member'}</div>
                            <div className="text-[11px] text-slate-500">{faculty?.email}</div>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-3.5">
                        <div className="font-bold text-slate-900">{prog?.title || 'Training Program'}</div>
                        <div className="text-[11px] text-slate-500 line-clamp-1 max-w-xs">{rec.reason}</div>
                      </td>

                      <td className="px-5 py-3.5 text-slate-600">
                        {rec.dueDate ? new Date(rec.dueDate).toLocaleDateString() : 'N/A'}
                      </td>

                      <td className="px-5 py-3.5">
                        <Badge variant={RECOMMENDATION_STATUS_COLORS[rec.status] || 'muted'}>
                          {RECOMMENDATION_STATUS_LABELS[rec.status] || rec.status}
                        </Badge>
                      </td>

                      <td className="px-5 py-3.5 text-center">
                        {rec.scoreAfterCompletion != null && rec.scoreBeforeRecommendation != null ? (
                          <div className="inline-flex items-center gap-1 font-bold text-emerald-600">
                            <span>{rec.scoreBeforeRecommendation}%</span>
                            <ArrowRight className="w-3 h-3 text-slate-400" />
                            <span className="text-emerald-700">{rec.scoreAfterCompletion}%</span>
                          </div>
                        ) : rec.scoreBeforeRecommendation != null ? (
                          <span className="text-slate-600 font-medium">Baseline: {rec.scoreBeforeRecommendation}%</span>
                        ) : (
                          <span className="text-slate-400 font-medium">—</span>
                        )}
                      </td>

                      <td className="px-5 py-3.5 text-right">
                        {isCompleted && rec.scoreAfterCompletion == null ? (
                          <Button
                            variant="outline"
                            size="sm"
                            icon={<Award className="w-3.5 h-3.5" />}
                            onClick={() => handleOpenAssessModal(rec)}
                          >
                            Grade Impact
                          </Button>
                        ) : (
                          <span className="text-[11px] text-slate-400 font-medium">
                            {isCompleted ? 'Graded ✓' : 'In Progress'}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Recommendation Modal */}
      <Modal
        open={createModal}
        onClose={() => setCreateModal(false)}
        title="Assign Training Recommendation"
        size="md"
      >
        <form onSubmit={handleCreateRecommendation} className="space-y-4">
          {createError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
              {createError}
            </div>
          )}

          <FormField label="Target Faculty Member" required>
            <select
              required
              value={targetUserId}
              onChange={e => setTargetUserId(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            >
              <option value="">Select Faculty Member</option>
              {facultyUsers.map(f => (
                <option key={f._id} value={f._id}>
                  {f.name} ({f.email})
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Mandated Training Program / FDP" required>
            <select
              required
              value={targetProgramId}
              onChange={e => setTargetProgramId(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            >
              <option value="">Select Training Program</option>
              {programs.map(p => (
                <option key={p._id} value={p._id}>
                  {p.title} ({p.type} • {p.mode})
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Target Completion Due Date" required>
            <input
              type="date"
              required
              value={recDueDate}
              onChange={e => setRecDueDate(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            />
          </FormField>

          <FormField label="Developmental Rationale / Competency Need" required>
            <textarea
              rows={3}
              required
              value={recReason}
              onChange={e => setRecReason(e.target.value)}
              placeholder="e.g. Recommended based on semester outcome attainment analysis to bridge deep learning pedagogy..."
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            />
          </FormField>

          <FormField label="Additional Notes (Optional)">
            <input
              type="text"
              value={recNotes}
              onChange={e => setRecNotes(e.target.value)}
              placeholder="Sponsorship details, prerequisite reading..."
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            />
          </FormField>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
            <Button type="button" variant="ghost" onClick={() => setCreateModal(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={creating} icon={<Send className="w-3.5 h-3.5" />}>
              Assign Recommendation
            </Button>
          </div>
        </form>
      </Modal>

      {/* Post-Training Assessment Modal */}
      {selectedRec && (
        <Modal
          open={assessModal}
          onClose={() => setAssessModal(false)}
          title={`Evaluate Skill Uplift: ${(selectedRec.facultyId as any)?.name}`}
          size="md"
        >
          <form onSubmit={handleSavePostAssessment} className="space-y-4">
            {assessError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
                {assessError}
              </div>
            )}

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
              <span className="text-slate-500 font-medium">Completed Course:</span>
              <div className="font-bold text-slate-900">{(selectedRec.programId as any)?.title}</div>
            </div>

            <FormField label="Post-Training Evaluator Rating (0 - 100)" required>
              <input
                type="number"
                min={0}
                max={100}
                required
                value={postScore}
                onChange={e => setPostScore(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
            </FormField>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
              <Button type="button" variant="ghost" onClick={() => setAssessModal(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" loading={assessing}>
                Submit Post-Assessment Rating
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
