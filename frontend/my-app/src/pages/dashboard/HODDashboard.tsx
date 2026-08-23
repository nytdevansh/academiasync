import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, CheckSquare, GraduationCap, TrendingUp, CheckCircle2, XCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { useAuth } from '../../context/AuthContext';
import { StatCard } from '../../components/ui/StatCard';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { getDashboardStats } from '../../api/reports';
import { getPendingApprovals, approveEnrollment, rejectEnrollment } from '../../api/training';
import { CHART_COLORS, TRAINING_STATUS_LABELS, TRAINING_STATUS_COLORS } from '../../utils/constants';

export const HODDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>(null);
  const [pending, setPending] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const [s, p] = await Promise.all([getDashboardStats(), getPendingApprovals()]);
      if (s.success) setStats(s.data);
      if (p.success) setPending(p.data || []);
    } catch {
      setStats({ totalFaculty: 14, pendingApprovals: 3, trainingCoverage: 78, totalEnrollments: 28 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

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

  if (loading) return <LoadingSpinner text="Loading HOD dashboard..." />;

  const mockCompetencyData = [
    { name: 'Beginner', value: 2 }, { name: 'Developing', value: 4 },
    { name: 'Proficient', value: 5 }, { name: 'Advanced', value: 3 }, { name: 'Expert', value: 1 },
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Head of Department Overview
          </h1>
          <p className="text-xs font-medium text-slate-500 mt-1">
            {user?.department && typeof user.department !== 'string' ? user.department.name : 'Computer Science & Engineering'} • Faculty Operations
          </p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard label="Total Department Faculty" value={stats?.totalFaculty || 14} icon={<Users className="w-5 h-5 text-blue-600" />} color="blue" subtitle="Active teaching personnel" />
        <StatCard label="Pending Approvals" value={stats?.pendingApprovals || pending.length} icon={<CheckSquare className="w-5 h-5 text-amber-600" />} color="gold" subtitle={pending.length > 0 ? `${pending.length} nominations need review` : 'All caught up'} />
        <StatCard label="Training Coverage" value={`${stats?.trainingCoverage || 78}%`} icon={<GraduationCap className="w-5 h-5 text-teal-600" />} color="teal" subtitle="Faculty enrolled in FDPs" />
        <StatCard label="Total Enrollments" value={stats?.totalEnrollments || 28} icon={<TrendingUp className="w-5 h-5 text-indigo-600" />} color="violet" subtitle="Completed & active programs" />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <Card className="lg:col-span-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Competency Level Distribution</h3>
              <p className="text-xs text-slate-500">Skill matrix across department faculty</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={mockCompetencyData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                {mockCompetencyData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0' }} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', color: '#64748B' }} />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        <Card className="lg:col-span-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Training Participation</h3>
              <p className="text-xs text-slate-500">Department nomination lifecycle</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={[
              { status: 'Nominated', count: 3 }, { status: 'Approved', count: 8 },
              { status: 'Attended', count: 5 }, { status: 'Completed', count: 12 },
            ]} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="status" tick={{ fill: '#64748B', fontSize: 11 }} />
              <YAxis tick={{ fill: '#64748B', fontSize: 11 }} />
              <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0' }} />
              <Bar dataKey="count" fill="#0F766E" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
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
    </div>
  );
};