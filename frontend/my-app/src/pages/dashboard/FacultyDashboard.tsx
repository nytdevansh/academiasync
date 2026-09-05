import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  GraduationCap,
  Star,
  Bell,
  CheckCircle2,
  TrendingUp,
  Award,
  ArrowRight,
  AlertTriangle,
  Clock,
  Sparkles,
  ArrowUpRight,
  XCircle
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { useAuth } from '../../context/AuthContext';
import { StatCard } from '../../components/ui/StatCard';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { getDashboardStats } from '../../api/reports';
import { getMyEnrollments } from '../../api/training';
import { getMyAppraisals } from '../../api/appraisals';
import {
  getMyRecommendations,
  enrollFromRecommendation,
  ignoreRecommendation,
  type TrainingRecommendation
} from '../../api/recommendations';
import {
  TRAINING_STATUS_COLORS,
  TRAINING_STATUS_LABELS,
  CHART_COLORS,
  RECOMMENDATION_STATUS_LABELS,
  RECOMMENDATION_STATUS_COLORS
} from '../../utils/constants';

export const FacultyDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>(null);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [appraisals, setAppraisals] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<TrainingRecommendation[]>([]);
  const [enrollingRec, setEnrollingRec] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Decline Modal State
  const [declineModalOpen, setDeclineModalOpen] = useState(false);
  const [recToDecline, setRecToDecline] = useState<TrainingRecommendation | null>(null);
  const [declineReason, setDeclineReason] = useState('');
  const [declining, setDeclining] = useState(false);

  const fetchDashboardData = async () => {
    try {
      const [s, e, a, r] = await Promise.all([
        getDashboardStats(),
        getMyEnrollments(),
        getMyAppraisals(),
        getMyRecommendations(),
      ]);
      if (s.success) setStats(s.data);
      if (e.success) setEnrollments(e.data || []);
      if (a.success) setAppraisals(a.data || []);
      if (r.success) setRecommendations(r.data || []);
    } catch {
      setStats({
        profileCompleteness: 0,
        totalTrainings: 0,
        activeTrainings: 0,
        completedTrainings: 0,
        latestAppraisalScore: null,
        unreadNotifications: 0,
        recommendedTrainings: 0
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleEnrollFromRec = async (rec: TrainingRecommendation) => {
    setEnrollingRec(rec._id);
    try {
      await enrollFromRecommendation(rec._id);
      await fetchDashboardData();
    } catch { }
    finally { setEnrollingRec(null); }
  };

  const handleConfirmDecline = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recToDecline) return;
    setDeclining(true);
    try {
      await ignoreRecommendation(recToDecline._id, declineReason || 'Declined by faculty member');
      setDeclineModalOpen(false);
      setRecToDecline(null);
      setDeclineReason('');
      await fetchDashboardData();
    } catch { }
    finally { setDeclining(false); }
  };

  if (loading) return <LoadingSpinner text="Loading faculty dashboard..." />;

  const statusBreakdown = enrollments.reduce((acc: any, e: any) => {
    acc[e.status] = (acc[e.status] || 0) + 1;
    return acc;
  }, {});
  const pieData = Object.entries(statusBreakdown).map(([name, value]) => ({ name: TRAINING_STATUS_LABELS[name] || name, value }));

  const monthlyHoursData = useMemo(() => {
    const monthsMap = new Map<string, number>();
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toLocaleString('en-US', { month: 'short' });
      monthsMap.set(key, 0);
    }

    enrollments.forEach((e) => {
      if (['completed', 'certified', 'attended'].includes(e.status)) {
        const date = e.completionDate || e.updatedAt || e.createdAt;
        if (date) {
          const d = new Date(date);
          const key = d.toLocaleString('en-US', { month: 'short' });
          if (monthsMap.has(key)) {
            const hours = (e.programId as any)?.durationHours || 8;
            monthsMap.set(key, (monthsMap.get(key) || 0) + hours);
          }
        }
      }
    });

    const data = Array.from(monthsMap.entries()).map(([month, hours]) => ({ month, hours }));
    const totalHours = data.reduce((sum, d) => sum + d.hours, 0);
    return { data, totalHours };
  }, [enrollments]);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Welcome, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-xs font-medium text-slate-500 mt-1">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} • Department of Computer Science
          </p>
        </div>

        {stats?.unreadNotifications > 0 && (
          <div className="flex items-center gap-2 px-3.5 py-1.5 bg-blue-50 border border-blue-200 rounded-xl text-blue-700 text-xs font-semibold">
            <Bell className="w-4 h-4 text-blue-600" />
            <span>{stats?.unreadNotifications} unread notifications</span>
          </div>
        )}
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard label="Profile Completeness" value={`${stats?.profileCompleteness ?? 0}%`} icon={<Star className="w-5 h-5 text-amber-600" />} color="gold" subtitle="Qualifications & teaching history" />
        <StatCard label="Active Trainings" value={stats?.activeTrainings ?? 0} icon={<BookOpen className="w-5 h-5 text-blue-600" />} color="blue" subtitle="Current nominations & FDPs" />
        <StatCard label="Latest Appraisal" value={stats?.latestAppraisalScore != null ? `${stats.latestAppraisalScore}%` : 'N/A'} icon={<Award className="w-5 h-5 text-teal-600" />} color="teal" subtitle="Overall performance score" />
        <StatCard label="Completed FDPs" value={stats?.completedTrainings ?? 0} icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />} color="emerald" subtitle="Certified training programs" />
      </div>

      {/* Recommended For You Section */}
      {(() => {
        const activeRecs = recommendations.filter(r => r.status !== 'ignored');
        if (activeRecs.length === 0) return null;
        const overdueCount = activeRecs.filter(r => r.status === 'overdue').length;
        return (
          <Card>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">Recommended For You (Faculty Development Loop)</h3>
                {overdueCount > 0 && (
                  <Badge variant="danger">{overdueCount} Overdue</Badge>
                )}
              </div>
              <span className="text-xs text-slate-500">
                {activeRecs.length} assigned program{activeRecs.length !== 1 ? 's' : ''} from your HOD/Dean
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Program / Skill Target</th>
                    <th className="py-3 px-4">Competency Gap Reason</th>
                    <th className="py-3 px-4">Assigned By</th>
                    <th className="py-3 px-4">Due Date</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-center">Measured Competency Impact</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {activeRecs.map(rec => {
                    const dueDate = new Date(rec.dueDate);
                    const daysLeft = Math.ceil((dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                    const isOverdue = rec.status === 'overdue' || (rec.status !== 'completed' && daysLeft < 0);
                    const effectiveness = rec.programId?.effectiveness;
                    return (
                      <tr key={rec._id} className={`hover:bg-slate-50/70 transition-colors ${isOverdue ? 'bg-red-50/40' : ''}`}>
                        <td className="py-3.5 px-4 font-semibold text-slate-900 max-w-[200px]">
                          <div>{rec.programId?.title || rec.skillAreaId?.name || 'Targeted Workshop'}</div>
                          {rec.programId?.type && (
                            <span className="text-slate-400 font-normal text-[11px]">{rec.programId.type}</span>
                          )}
                          {effectiveness?.avgImprovementDelta > 0 && (
                            <div className="flex items-center gap-1 text-[10px] text-indigo-600 font-semibold mt-0.5">
                              <Sparkles className="w-3 h-3" />
                              <span>Historical +{effectiveness.avgImprovementDelta}% avg boost</span>
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-4 max-w-[200px] text-slate-500 truncate">{rec.reason}</td>
                        <td className="py-3.5 px-4 font-medium">{rec.recommendedBy?.name || 'Head of Department'}</td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className={isOverdue ? 'text-red-600 font-semibold' : 'text-slate-600'}>
                            {dueDate.toLocaleDateString()}
                          </div>
                          {isOverdue && rec.status !== 'completed' ? (
                            <div className="flex items-center gap-1 text-red-500 mt-0.5 text-[10px] font-semibold">
                              <AlertTriangle className="w-3 h-3" />{Math.abs(daysLeft)}d overdue
                            </div>
                          ) : daysLeft <= 7 && rec.status !== 'completed' ? (
                            <div className="flex items-center gap-1 text-amber-500 mt-0.5 text-[10px]">
                              <Clock className="w-3 h-3" />{daysLeft}d left
                            </div>
                          ) : null}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <Badge variant={RECOMMENDATION_STATUS_COLORS[rec.status] || 'muted'}>
                            {RECOMMENDATION_STATUS_LABELS[rec.status] || rec.status}
                          </Badge>
                        </td>
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          {rec.scoreAfterCompletion != null ? (
                            <div className="inline-flex flex-col items-center">
                              <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-800">
                                <span>{rec.scoreBeforeRecommendation ?? 0}%</span>
                                <span>➔</span>
                                <span className="text-blue-700">{rec.scoreAfterCompletion}%</span>
                              </div>
                              {rec.improvementDelta != null && (
                                <span className="inline-flex items-center gap-0.5 text-[10px] font-extrabold text-emerald-600">
                                  <ArrowUpRight className="w-3 h-3" />
                                  +{rec.improvementDelta.toFixed(1)}% verified growth
                                </span>
                              )}
                            </div>
                          ) : rec.scoreBeforeRecommendation != null ? (
                            <span className="text-slate-500 text-xs">
                              Baseline: <strong className="text-slate-800">{rec.scoreBeforeRecommendation}%</strong>
                            </span>
                          ) : (
                            <span className="text-slate-400 text-xs">Awaiting completion</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-2">
                            {rec.status === 'pending' && rec.programId && (
                              <Button
                                size="sm"
                                variant="primary"
                                loading={enrollingRec === rec._id}
                                onClick={() => handleEnrollFromRec(rec)}
                              >
                                Enrol Now
                              </Button>
                            )}
                            {rec.status === 'pending' && !rec.programId && (
                              <Button size="sm" variant="outline" onClick={() => navigate('/training/catalog')}>
                                Browse Catalog
                              </Button>
                            )}
                            {rec.status === 'enrolled' && (
                              <Badge variant="info">Enrolled ✓</Badge>
                            )}
                            {rec.status === 'completed' && (
                              <span className="inline-flex items-center gap-1 text-emerald-600 font-bold text-xs">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Completed
                              </span>
                            )}
                            {rec.status === 'pending' && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-slate-400 hover:text-rose-600"
                                onClick={() => {
                                  setRecToDecline(rec);
                                  setDeclineReason('');
                                  setDeclineModalOpen(true);
                                }}
                              >
                                Decline
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        );
      })()}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Training Hours Bar Chart */}
        <Card className="lg:col-span-7">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Training &amp; Pedagogy Hours</h3>
              <p className="text-xs text-slate-500">Monthly training hours logged over past 6 months</p>
            </div>
            <Badge variant="info">FDP Activity</Badge>
          </div>
          {monthlyHoursData.totalHours > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={monthlyHoursData.data} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="month" tick={{ fill: '#64748B', fontSize: 12 }} />
                <YAxis tick={{ fill: '#64748B', fontSize: 12 }} />
                <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }} />
                <Bar dataKey="hours" fill="#2563EB" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-xs text-slate-400 gap-2">
              <Award className="w-8 h-8 text-slate-300" />
              <span>No completed training hours logged in the past 6 months</span>
              <Button size="sm" variant="outline" onClick={() => navigate('/training/catalog')}>
                Browse Training Programs
              </Button>
            </div>
          )}
        </Card>

        {/* Training Status Pie Chart */}
        <Card className="lg:col-span-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Enrollment Status</h3>
              <p className="text-xs text-slate-500">Breakdown of current nominations</p>
            </div>
          </div>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={4} dataKey="value">
                  {pieData.map((_, index) => <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', color: '#64748B' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-xs text-slate-400 gap-2">
              <span>No active enrollments recorded</span>
              <Button size="sm" variant="outline" onClick={() => navigate('/training/catalog')}>
                Explore Training Catalog
              </Button>
            </div>
          )}
        </Card>
      </div>

      {/* Recent Enrollments Table */}
      <Card>
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Recent Training Nominations &amp; Certifications</h3>
            <p className="text-xs text-slate-500">Your latest faculty development activities</p>
          </div>
          <Button size="sm" variant="ghost" onClick={() => navigate('/training/my-enrollments')}>
            View All Enrollments →
          </Button>
        </div>

        {enrollments.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-400 space-y-2">
            <GraduationCap className="w-8 h-8 mx-auto text-slate-300" />
            <p>No enrollment records found. Explore programs in the catalog to get started.</p>
            <Button size="sm" variant="primary" onClick={() => navigate('/training/catalog')}>
              Browse Catalog
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Program Title</th>
                  <th className="py-3 px-4">Format</th>
                  <th className="py-3 px-4">Start Date</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {enrollments.slice(0, 5).map(e => (
                  <tr key={e._id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-slate-900">{e.programId?.title || 'Generative AI in Education FDP'}</td>
                    <td className="py-3.5 px-4"><Badge variant="info">{e.programId?.type || 'FDP'}</Badge></td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {e.programId?.startDate ? new Date(e.programId.startDate).toLocaleDateString() : 'Sep 10, 2026'}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant={e.status === 'completed' ? 'success' : e.status === 'approved' ? 'info' : 'warning'}>
                        {TRAINING_STATUS_LABELS[e.status] || 'Approved'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Modal: Decline Recommendation */}
      <Modal
        open={declineModalOpen}
        onClose={() => setDeclineModalOpen(false)}
        title="Decline Recommended Training"
        size="sm"
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setDeclineModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              loading={declining}
              onClick={handleConfirmDecline}
            >
              Confirm Decline
            </Button>
          </>
        }
      >
        <form onSubmit={handleConfirmDecline} className="space-y-3 text-xs">
          <p className="text-slate-600">
            You are declining recommendation for:{' '}
            <span className="font-bold text-slate-900">
              {recToDecline?.programId?.title || recToDecline?.skillAreaId?.name || 'Assigned Training'}
            </span>
          </p>
          <div>
            <label className="block font-bold text-slate-700 mb-1">Reason for declining *</label>
            <textarea
              rows={3}
              value={declineReason}
              onChange={(e) => setDeclineReason(e.target.value)}
              placeholder="e.g. Completed equivalent certification outside campus; conflicting semester exam duty."
              className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 text-slate-900"
              required
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};
