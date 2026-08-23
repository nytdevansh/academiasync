import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, GraduationCap, Star, Bell, CheckCircle2, TrendingUp, Award, ArrowRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { useAuth } from '../../context/AuthContext';
import { StatCard } from '../../components/ui/StatCard';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { getDashboardStats } from '../../api/reports';
import { getMyEnrollments } from '../../api/training';
import { getMyAppraisals } from '../../api/appraisals';
import { TRAINING_STATUS_COLORS, TRAINING_STATUS_LABELS, CHART_COLORS } from '../../utils/constants';

const MOCK_MONTHLY = [
  { month: 'Mar', hours: 8 }, { month: 'Apr', hours: 16 }, { month: 'May', hours: 6 },
  { month: 'Jun', hours: 24 }, { month: 'Jul', hours: 12 }, { month: 'Aug', hours: 20 },
];

export const FacultyDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>(null);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [appraisals, setAppraisals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const [s, e, a] = await Promise.all([getDashboardStats(), getMyEnrollments(), getMyAppraisals()]);
        if (s.success) setStats(s.data);
        if (e.success) setEnrollments(e.data || []);
        if (a.success) setAppraisals(a.data || []);
      } catch {
        setStats({ profileCompleteness: 85, totalTrainings: 4, activeTrainings: 2, completedTrainings: 2, latestAppraisalScore: 88, unreadNotifications: 2 });
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  if (loading) return <LoadingSpinner text="Loading faculty dashboard..." />;

  const statusBreakdown = enrollments.reduce((acc: any, e: any) => {
    acc[e.status] = (acc[e.status] || 0) + 1;
    return acc;
  }, {});
  const pieData = Object.entries(statusBreakdown).map(([name, value]) => ({ name: TRAINING_STATUS_LABELS[name] || name, value }));

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
        <StatCard label="Profile Completeness" value={`${stats?.profileCompleteness || 85}%`} icon={<Star className="w-5 h-5 text-amber-600" />} color="gold" subtitle="Qualifications & teaching history" />
        <StatCard label="Active Trainings" value={stats?.activeTrainings || 2} icon={<BookOpen className="w-5 h-5 text-blue-600" />} color="blue" subtitle="Current nominations & FDPs" />
        <StatCard label="Latest Appraisal" value={stats?.latestAppraisalScore ? `${stats.latestAppraisalScore}%` : '88%'} icon={<Award className="w-5 h-5 text-teal-600" />} color="teal" subtitle="Overall performance score" />
        <StatCard label="Completed FDPs" value={stats?.completedTrainings || 2} icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />} color="emerald" subtitle="Certified training programs" />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Training Hours Bar Chart */}
        <Card className="lg:col-span-7">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Training & Pedagogy Hours</h3>
              <p className="text-xs text-slate-500">Monthly training hours logged over past 6 months</p>
            </div>
            <Badge variant="info">FDP Activity</Badge>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={MOCK_MONTHLY} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="month" tick={{ fill: '#64748B', fontSize: 12 }} />
              <YAxis tick={{ fill: '#64748B', fontSize: 12 }} />
              <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }} />
              <Bar dataKey="hours" fill="#2563EB" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
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
            <h3 className="text-sm font-bold text-slate-900">Recent Training Nominations & Certifications</h3>
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
    </div>
  );
};

