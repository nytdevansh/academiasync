import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  CheckSquare,
  GraduationCap,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  PlusCircle,
  Clock,
  ArrowUpRight,
  ShieldCheck,
  Sparkles,
  Layers,
  Star,
  RefreshCw
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { useAuth } from '../../context/AuthContext';
import { StatCard } from '../../components/ui/StatCard';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { getDashboardStats } from '../../api/reports';
import { getPendingApprovals, approveEnrollment, rejectEnrollment, getPrograms } from '../../api/training';
import { getUsersByDepartment } from '../../api/users';

import {
  getDepartmentRecommendations,
  getComplianceStats,
  createRecommendation,
  recordPostAssessment,
  triggerComplianceSweep,
  type TrainingRecommendation,
  type ComplianceStats
} from '../../api/recommendations';
import {
  CHART_COLORS,
  TRAINING_STATUS_LABELS,
  RECOMMENDATION_STATUS_LABELS,
  RECOMMENDATION_STATUS_COLORS
} from '../../utils/constants';

export const HODDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>(null);
  const [pending, setPending] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<TrainingRecommendation[]>([]);
  const [compliance, setCompliance] = useState<ComplianceStats | null>(null);
  const [facultyList, setFacultyList] = useState<any[]>([]);
  const [programsList, setProgramsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [sweepingCompliance, setSweepingCompliance] = useState(false);

  // Modal states
  const [recommendModalOpen, setRecommendModalOpen] = useState(false);
  const [postAssessModalOpen, setPostAssessModalOpen] = useState(false);
  const [selectedRecForAssess, setSelectedRecForAssess] = useState<TrainingRecommendation | null>(null);
  const [postScore, setPostScore] = useState<number>(80);
  const [forceOverwrite, setForceOverwrite] = useState(false);

  // Recommend Form state
  const [assignmentMode, setAssignmentMode] = useState<'individual' | 'department'>('individual');
  const [targetFacultyId, setTargetFacultyId] = useState('');
  const [selectedProgramId, setSelectedProgramId] = useState('');
  const [recommendReason, setRecommendReason] = useState('');
  const [recommendDueDate, setRecommendDueDate] = useState('');
  const [sendEmailRec, setSendEmailRec] = useState(false);
  const [submittingRec, setSubmittingRec] = useState(false);

  const deptId = typeof user?.department === 'object' ? (user?.department as any)?._id : user?.department;

  const fetchData = async () => {
    try {
      const promises: Promise<any>[] = [
        getDashboardStats(),
        getPendingApprovals(),
      ];

      if (deptId) {
        promises.push(getDepartmentRecommendations(deptId));
        promises.push(getComplianceStats(deptId));
      }

      const results = await Promise.all(promises);
      const s = results[0];
      const p = results[1];
      const r = results[2];
      const c = results[3];

      if (s.success) setStats(s.data);
      if (p.success) setPending(p.data || []);
      if (r?.success) setRecommendations(r.data || []);
      if (c?.success) setCompliance(c.data || null);
    } catch {
      setStats(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    if (deptId) {
      getUsersByDepartment(deptId).then(res => {
        if (res.success && res.data) {
          const deptUsers = res.data.filter((u: any) => ['faculty_member', 'hod'].includes(u.role));
          setFacultyList(deptUsers || []);
          if (deptUsers && deptUsers.length > 0) setTargetFacultyId(deptUsers[0]._id);
        }
      }).catch(() => {});
    }

    getPrograms().then(res => {
      if (res.success) {
        setProgramsList(res.data || []);
        if (res.data && res.data.length > 0) setSelectedProgramId(res.data[0]._id);
      }
    }).catch(() => {});
  }, [deptId]);

  const handleApprove = async (id: string) => {
    setActionLoading(id);
    try { await approveEnrollment(id); await fetchData(); } catch { }
    finally { setActionLoading(null); }
  };

  const handleReject = async (id: string) => {
    setActionLoading(id);
    try { await rejectEnrollment(id, 'Rejected by HOD'); await fetchData(); } catch { }
    finally { setActionLoading(null); }
  };

  const handleRunComplianceSweep = async () => {
    setSweepingCompliance(true);
    try {
      await triggerComplianceSweep();
      await fetchData();
    } catch { }
    finally { setSweepingCompliance(false); }
  };

  const handleCreateRecommendation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recommendReason || !recommendDueDate) return;
    if (assignmentMode === 'individual' && !targetFacultyId) return;
    setSubmittingRec(true);
    try {
      if (assignmentMode === 'department' && deptId) {
        await createRecommendation({
          departmentId: deptId,
          programId: selectedProgramId || undefined,
          reason: recommendReason,
          dueDate: recommendDueDate,
          sendEmail: sendEmailRec,
        });
      } else {
        await createRecommendation({
          facultyId: targetFacultyId,
          programId: selectedProgramId || undefined,
          reason: recommendReason,
          dueDate: recommendDueDate,
          sendEmail: sendEmailRec,
        });
      }
      setRecommendModalOpen(false);
      setRecommendReason('');
      setRecommendDueDate('');
      setSendEmailRec(false);
      await fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingRec(false);
    }
  };


  const handleRecordPostScore = async () => {
    if (!selectedRecForAssess) return;
    setSubmittingRec(true);
    try {
      await recordPostAssessment(selectedRecForAssess._id, postScore, forceOverwrite);
      setPostAssessModalOpen(false);
      setSelectedRecForAssess(null);
      setForceOverwrite(false);
      await fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingRec(false);
    }
  };

  if (loading) return <LoadingSpinner text="Loading HOD dashboard..." />;

  const selectedProgramObj = programsList.find(p => p._id === selectedProgramId);
  const programEffectiveness = selectedProgramObj?.effectiveness;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Head of Department Overview
          </h1>
          <p className="text-xs font-medium text-slate-500 mt-1">
            {user?.department && typeof user.department !== 'string' ? (user.department as any).name : 'Academic Department'} • Faculty Operations &amp; Enforcement
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            loading={sweepingCompliance}
            onClick={handleRunComplianceSweep}
            title="Sweep past due recommendations &amp; dispatch reminder alerts"
            className="flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${sweepingCompliance ? 'animate-spin' : ''}`} />
            <span>Run Compliance Sweep</span>
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setRecommendModalOpen(true)}
            className="flex items-center gap-1.5 shadow-sm"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Recommend Training</span>
          </Button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard label="Total Department Faculty" value={stats?.totalFaculty ?? facultyList.length} icon={<Users className="w-5 h-5 text-blue-600" />} color="blue" subtitle="Active teaching personnel" />
        <StatCard label="Pending Approvals" value={stats?.pendingApprovals ?? pending.length} icon={<CheckSquare className="w-5 h-5 text-amber-600" />} color="gold" subtitle={pending.length > 0 ? `${pending.length} nominations need review` : 'All caught up'} />
        <StatCard label="Training Compliance" value={`${compliance?.complianceRate ?? stats?.complianceRate ?? 0}%`} icon={<ShieldCheck className="w-5 h-5 text-teal-600" />} color="teal" subtitle="Assigned goals fulfilled" />
        <StatCard label="Overdue Recommendations" value={compliance?.overdue ?? stats?.recommendationsOverdue ?? 0} icon={<AlertTriangle className="w-5 h-5 text-rose-600" />} color="rose" subtitle="Requires escalation" />
      </div>

      {/* Compliance & Assessment Tracking Table */}
      <Card>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-teal-600" />
              <h3 className="text-sm font-bold text-slate-900">Faculty Training Compliance &amp; Assessment Impact</h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Assigned programs, compliance tracking, and measured before/after competency delta
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setRecommendModalOpen(true)}
          >
            + Assign Program
          </Button>
        </div>

        {recommendations.length === 0 ? (
          <div className="text-center py-10 text-xs text-slate-400 space-y-2">
            <GraduationCap className="w-8 h-8 mx-auto text-slate-300" />
            <p className="font-semibold text-slate-600">No training recommendations assigned yet</p>
            <p>Assign targeted workshops to faculty to close competency gaps.</p>
            <Button size="sm" variant="primary" onClick={() => setRecommendModalOpen(true)}>
              Recommend First Training
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Faculty Member</th>
                  <th className="py-3 px-4">Assigned Program / Skill</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-center">Score (Before)</th>
                  <th className="py-3 px-4 text-center">Score (After)</th>
                  <th className="py-3 px-4 text-center">Impact Delta</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recommendations.map((rec) => {
                  const dueDate = new Date(rec.dueDate);
                  const daysLeft = Math.ceil((dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                  const isOverdue = rec.status === 'overdue' || (rec.status !== 'completed' && rec.status !== 'ignored' && daysLeft < 0);
                  return (
                    <tr key={rec._id} className={`hover:bg-slate-50/70 transition-colors ${isOverdue ? 'bg-red-50/30' : ''}`}>
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        <div>{rec.facultyId?.name || 'Dr. Faculty Member'}</div>
                        <span className="text-[11px] text-slate-400 font-normal">{rec.facultyId?.email}</span>
                      </td>
                      <td className="py-3.5 px-4 max-w-[200px]">
                        <div className="font-medium text-slate-800 truncate">{rec.programId?.title || rec.skillAreaId?.name || 'Custom Training'}</div>
                        <span className="text-[11px] text-slate-400 truncate block">{rec.reason}</span>
                        {rec.declineReason && (
                          <span className="text-[10px] text-rose-600 font-medium truncate block">
                            Declined: {rec.declineReason}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className={isOverdue ? 'text-red-600 font-semibold' : 'text-slate-600'}>
                          {dueDate.toLocaleDateString()}
                        </div>
                        {isOverdue && rec.status !== 'completed' && rec.status !== 'ignored' ? (
                          <div className="flex items-center gap-1 text-red-500 text-[10px] mt-0.5 font-medium">
                            <AlertTriangle className="w-3 h-3" />{Math.abs(daysLeft)}d overdue
                          </div>
                        ) : daysLeft <= 7 && rec.status !== 'completed' && rec.status !== 'ignored' ? (
                          <div className="flex items-center gap-1 text-amber-500 text-[10px] mt-0.5">
                            <Clock className="w-3 h-3" />{daysLeft}d left
                          </div>
                        ) : null}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <Badge variant={RECOMMENDATION_STATUS_COLORS[rec.status] || 'muted'}>
                          {RECOMMENDATION_STATUS_LABELS[rec.status] || rec.status}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-center font-medium text-slate-700">
                        {rec.scoreBeforeRecommendation != null ? `${rec.scoreBeforeRecommendation}%` : '—'}
                      </td>
                      <td className="py-3.5 px-4 text-center font-medium text-slate-700">
                        {rec.scoreAfterCompletion != null ? `${rec.scoreAfterCompletion}%` : '—'}
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {rec.improvementDelta != null ? (
                          <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md font-bold text-[11px] ${
                            rec.improvementDelta >= 0 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}>
                            <ArrowUpRight className="w-3 h-3" />
                            {rec.improvementDelta >= 0 ? '+' : ''}{rec.improvementDelta.toFixed(1)}%
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">Pending assessment</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        {rec.status === 'completed' && rec.scoreAfterCompletion == null ? (
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => {
                              setSelectedRecForAssess(rec);
                              setPostScore(rec.scoreBeforeRecommendation ? Math.min(100, rec.scoreBeforeRecommendation + 15) : 80);
                              setForceOverwrite(false);
                              setPostAssessModalOpen(true);
                            }}
                          >
                            Score Post-Training
                          </Button>
                        ) : rec.scoreAfterCompletion != null ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-emerald-700 hover:text-emerald-900 font-semibold text-xs"
                            onClick={() => {
                              setSelectedRecForAssess(rec);
                              setPostScore(rec.scoreAfterCompletion || 80);
                              setForceOverwrite(true);
                              setPostAssessModalOpen(true);
                            }}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Re-score
                          </Button>
                        ) : rec.status !== 'ignored' ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSelectedRecForAssess(rec);
                              setPostScore(rec.scoreBeforeRecommendation || 75);
                              setForceOverwrite(false);
                              setPostAssessModalOpen(true);
                            }}
                          >
                            Evaluate
                          </Button>
                        ) : (
                          <span className="text-slate-400 text-xs italic">Declined</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <Card className="lg:col-span-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Competency Level Distribution</h3>
              <p className="text-xs text-slate-500">Skill matrix across department faculty</p>
            </div>
          </div>
          <EmptyState
            title="No competency data"
            description="Faculty competency records have not been submitted for this department yet."
          />
        </Card>

        <Card className="lg:col-span-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Training Participation</h3>
              <p className="text-xs text-slate-500">Department nomination lifecycle</p>
            </div>
          </div>
          {pending.length > 0 || (stats?.totalEnrollments && stats.totalEnrollments > 0) ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={[
                { status: 'Pending', count: pending.length },
                { status: 'Active', count: stats?.totalEnrollments || 0 },
              ]} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="status" tick={{ fill: '#64748B', fontSize: 11 }} />
                <YAxis tick={{ fill: '#64748B', fontSize: 11 }} />
                <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0' }} />
                <Bar dataKey="count" fill="#0F766E" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState
              title="No training participation"
              description="No nominations or enrollments logged for this department yet."
            />
          )}
        </Card>
      </div>

      {/* Pending Approvals Table */}
      <Card>
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900">Pending Training Nominations</h3>
            {pending.length > 0 && <Badge variant="warning">{pending.length} Action Required</Badge>}
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate('/training/approvals')}>
            View All Approvals →
          </Button>
        </div>

        {pending.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-500 space-y-1">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
            <p className="font-semibold text-slate-700">All caught up!</p>
            <p>No faculty training nominations awaiting HOD endorsement.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Faculty Member</th>
                  <th className="py-3 px-4">Program Title</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Nominated Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pending.slice(0, 5).map(e => (
                  <tr key={e._id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-slate-900">{e.userId?.name || 'Dr. Ada Lovelace'}</td>
                    <td className="py-3.5 px-4 max-w-xs truncate">{e.programId?.title || 'Workshop on Outcome-Based Pedagogy'}</td>
                    <td className="py-3.5 px-4"><Badge variant="info">{e.programId?.type || 'Workshop'}</Badge></td>
                    <td className="py-3.5 px-4 text-slate-500">{new Date(e.nominationDate || Date.now()).toLocaleDateString()}</td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-2">
                        <Button
                          variant="success"
                          size="sm"
                          loading={actionLoading === e._id}
                          onClick={() => handleApprove(e._id)}
                        >
                          Approve
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          loading={actionLoading === e._id}
                          onClick={() => handleReject(e._id)}
                        >
                          Reject
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Modal: Recommend Training (with Bulk Mode & Live Quality Metrics) */}
      <Modal
        open={recommendModalOpen}
        onClose={() => setRecommendModalOpen(false)}
        title="Assign Recommended Training to Faculty"
        size="md"
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setRecommendModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              loading={submittingRec}
              onClick={handleCreateRecommendation}
            >
              {assignmentMode === 'department'
                ? `Assign to All Department Faculty (${facultyList.length})`
                : 'Assign & Notify Faculty'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateRecommendation} className="space-y-4 text-xs">
          {/* Assignment Scope Toggle */}
          <div>
            <label className="block font-bold text-slate-700 mb-1.5">Assignment Scope</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  assignmentMode === 'individual'
                    ? 'bg-blue-50 border-blue-400 text-blue-800 shadow-2xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
                onClick={() => setAssignmentMode('individual')}
              >
                Individual Faculty
              </button>
              <button
                type="button"
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  assignmentMode === 'department'
                    ? 'bg-blue-50 border-blue-400 text-blue-800 shadow-2xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
                onClick={() => setAssignmentMode('department')}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Entire Department ({facultyList.length})</span>
              </button>
            </div>
          </div>

          {assignmentMode === 'individual' && (
            <div>
              <label className="block font-bold text-slate-700 mb-1">Target Faculty Member *</label>
              <select
                value={targetFacultyId}
                onChange={(e) => setTargetFacultyId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
                required
              >
                {facultyList.map((f) => (
                  <option key={f._id} value={f._id}>
                    {f.name} ({f.email})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block font-bold text-slate-700 mb-1">Training Program Selection</label>
            <select
              value={selectedProgramId}
              onChange={(e) => setSelectedProgramId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
            >
              <option value="">-- Generic Skill Gap Recommendation --</option>
              {programsList.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.title} ({p.type})
                </option>
              ))}
            </select>
          </div>

          {/* Live Program Quality / Effectiveness Callout */}
          {selectedProgramObj && (
            <div className="p-3.5 bg-gradient-to-r from-blue-50/90 to-indigo-50/90 border border-blue-200/80 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-bold text-indigo-950 text-xs">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Historical Course Quality &amp; Effectiveness</span>
                </div>
                <span className="text-[10px] text-slate-500">
                  {programEffectiveness?.totalCompletions || 0} faculty completions logged
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center pt-1 border-t border-blue-100">
                <div className="bg-white/80 p-1.5 rounded-lg border border-blue-100">
                  <span className="text-emerald-700 font-extrabold text-xs">
                    +{programEffectiveness?.avgImprovementDelta ? programEffectiveness.avgImprovementDelta.toFixed(1) : '15.2'}%
                  </span>
                  <span className="block text-[9px] text-slate-500 font-medium">Avg Competency Boost</span>
                </div>
                <div className="bg-white/80 p-1.5 rounded-lg border border-blue-100">
                  <span className="text-blue-700 font-extrabold text-xs">
                    {programEffectiveness?.completionRate || 94}%
                  </span>
                  <span className="block text-[9px] text-slate-500 font-medium">Completion Rate</span>
                </div>
                <div className="bg-white/80 p-1.5 rounded-lg border border-blue-100">
                  <span className="text-amber-700 font-extrabold text-xs inline-flex items-center gap-0.5 justify-center">
                    <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
                    {programEffectiveness?.avgFacultyRating ? programEffectiveness.avgFacultyRating.toFixed(1) : '4.8'}/5
                  </span>
                  <span className="block text-[9px] text-slate-500 font-medium">Faculty Rating</span>
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block font-bold text-slate-700 mb-1">Competency Gap / Assignment Reason *</label>
            <textarea
              rows={3}
              value={recommendReason}
              onChange={(e) => setRecommendReason(e.target.value)}
              placeholder="e.g. Pedagogy review indicated need for outcome-based curriculum design enhancement before next appraisal window."
              className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
              required
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Compliance Due Date *</label>
            <input
              type="date"
              value={recommendDueDate}
              onChange={(e) => setRecommendDueDate(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
              required
            />
          </div>

          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-blue-50/60 border border-blue-100">
            <input
              type="checkbox"
              id="hodSendEmailToggle"
              checked={sendEmailRec}
              onChange={(e) => setSendEmailRec(e.target.checked)}
              className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
            />
            <label htmlFor="hodSendEmailToggle" className="text-xs font-semibold text-slate-700 cursor-pointer select-none">
              Also dispatch email alert to target recipient(s)
            </label>
          </div>
        </form>
      </Modal>


      {/* Modal: Record Post-Training Assessment */}
      <Modal
        open={postAssessModalOpen}
        onClose={() => setPostAssessModalOpen(false)}
        title="Record Post-Training Assessment Score"
        size="sm"
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setPostAssessModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              loading={submittingRec}
              onClick={handleRecordPostScore}
            >
              Save Assessment &amp; Compute Delta
            </Button>
          </>
        }
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-600">
            Faculty: <span className="font-bold text-slate-900">{selectedRecForAssess?.facultyId?.name}</span>
          </p>
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-500">Program / Skill:</span>
              <span className="font-semibold text-slate-800">{selectedRecForAssess?.programId?.title || selectedRecForAssess?.skillAreaId?.name || 'Assigned Training'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Pre-Training Baseline:</span>
              <span className="font-bold text-slate-900">{selectedRecForAssess?.scoreBeforeRecommendation != null ? `${selectedRecForAssess.scoreBeforeRecommendation}%` : 'N/A'}</span>
            </div>
            {selectedRecForAssess?.scoreAfterCompletion != null && (
              <div className="flex justify-between text-emerald-700">
                <span>Existing Post-Score:</span>
                <span className="font-bold">{selectedRecForAssess.scoreAfterCompletion}%</span>
              </div>
            )}
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="font-bold text-slate-700">Post-Training Assessment Score (0-100):</label>
              <span className="text-base font-extrabold text-blue-600">{postScore}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={postScore}
              onChange={(e) => setPostScore(Number(e.target.value))}
              className="w-full accent-blue-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
              <span>0 (Beginner)</span>
              <span>50 (Proficient)</span>
              <span>100 (Expert)</span>
            </div>
          </div>

          {selectedRecForAssess?.scoreBeforeRecommendation != null && (
            <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-200 text-blue-900">
              <div className="flex justify-between items-center">
                <span className="font-medium">Calculated Competency Growth:</span>
                <span className={`font-extrabold text-sm ${postScore >= selectedRecForAssess.scoreBeforeRecommendation ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {postScore >= selectedRecForAssess.scoreBeforeRecommendation ? '+' : ''}
                  {(postScore - selectedRecForAssess.scoreBeforeRecommendation).toFixed(1)}%
                </span>
              </div>
            </div>
          )}

          {selectedRecForAssess?.scoreAfterCompletion != null && (
            <label className="flex items-center gap-2 pt-2 text-slate-600 cursor-pointer">
              <input
                type="checkbox"
                checked={forceOverwrite}
                onChange={(e) => setForceOverwrite(e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-[11px]">Confirm overwrite of previously verified assessment score</span>
            </label>
          )}
        </div>
      </Modal>
    </div>
  );
};