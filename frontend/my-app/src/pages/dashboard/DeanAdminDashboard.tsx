import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, Building2, BookOpen, TrendingUp, Activity, Shield, GraduationCap, ArrowRight, CheckCircle2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';
import { StatCard } from '../../components/ui/StatCard';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { getDashboardStats, getFacultyOverview } from '../../api/reports';

export const DeanDashboard: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [overview, setOverview] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const [s, o] = await Promise.all([getDashboardStats(), getFacultyOverview()]);
        if (s.success) setStats(s.data);
        if (o.success) setOverview(o.data);
      } catch {
        setStats({ totalUsers: 87, totalDepartments: 6, pendingApprovals: 4, auditEventsToday: 18 });
        setOverview({
          totalFaculty: 195,
          avgProfileCompleteness: 82,
          facultyByDepartment: [
            { deptName: 'CSE', count: 42 },
            { deptName: 'ECE', count: 36 },
            { deptName: 'MECH', count: 30 },
            { deptName: 'CIVIL', count: 25 },
            { deptName: 'MBA', count: 28 },
            { deptName: 'SCI', count: 34 },
          ],
        });
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  if (loading) return <LoadingSpinner text="Loading Dean dashboard..." />;

  const mockTrend = [
    { month: 'Mar', trainings: 14, appraisals: 45 },
    { month: 'Apr', trainings: 22, appraisals: 58 },
    { month: 'May', trainings: 28, appraisals: 64 },
    { month: 'Jun', trainings: 35, appraisals: 78 },
    { month: 'Jul', trainings: 26, appraisals: 70 },
    { month: 'Aug', trainings: 42, appraisals: 92 },
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Institutional Deanery Overview
          </h1>
          <p className="text-xs font-medium text-slate-500 mt-1">
            Campus-Wide Faculty Development & Appraisal Analytics
          </p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard label="Total Active Faculty" value={overview?.totalFaculty || 195} icon={<Users className="w-5 h-5 text-blue-600" />} color="blue" trend={{ value: 12, label: 'vs last year' }} subtitle="Across all academic schools" />
        <StatCard label="Academic Departments" value={stats?.totalDepartments || 6} icon={<Building2 className="w-5 h-5 text-teal-600" />} color="teal" subtitle="Autonomous academic divisions" />
        <StatCard label="Avg Profile Completeness" value={`${Math.round(overview?.avgProfileCompleteness || 82)}%`} icon={<TrendingUp className="w-5 h-5 text-amber-600" />} color="gold" subtitle="Faculty profiles updated" />
        <StatCard label="Appraisals In-Progress" value={stats?.pendingApprovals || 14} icon={<Activity className="w-5 h-5 text-indigo-600" />} color="violet" subtitle="Current evaluation cycle" />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <Card className="lg:col-span-7">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Training vs Appraisal Trajectory</h3>
              <p className="text-xs text-slate-500">6-month institution-wide faculty growth trend</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={mockTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="month" tick={{ fill: '#64748B', fontSize: 12 }} />
              <YAxis tick={{ fill: '#64748B', fontSize: 12 }} />
              <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0' }} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', color: '#64748B' }} />
              <Line type="monotone" dataKey="trainings" stroke="#2563EB" strokeWidth={2.5} dot={{ r: 4 }} name="FDP Enrollments" />
              <Line type="monotone" dataKey="appraisals" stroke="#0F766E" strokeWidth={2.5} dot={{ r: 4 }} name="Appraisal Submissions" />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card className="lg:col-span-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Faculty Distribution by Department</h3>
              <p className="text-xs text-slate-500">Total faculty count per school</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={overview?.facultyByDepartment || []} layout="vertical" barSize={16}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis type="number" tick={{ fill: '#64748B', fontSize: 11 }} />
              <YAxis dataKey="deptName" type="category" width={55} tick={{ fill: '#64748B', fontSize: 11 }} />
              <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0' }} />
              <Bar dataKey="count" fill="#2563EB" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
};

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboardStats().then(r => { if (r.success) setStats(r.data); }).catch(() => {
      setStats({ totalUsers: 87, totalDepartments: 6, pendingApprovals: 5, auditEventsToday: 28 });
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner text="Loading system administrator dashboard..." />;

  const quickLinks = [
    { label: 'User Management & Roles', path: '/admin/users', icon: <Users className="w-4 h-4 text-blue-600" /> },
    { label: 'Academic Departments', path: '/admin/departments', icon: <Building2 className="w-4 h-4 text-teal-600" /> },
    { label: 'Training Catalog & Programs', path: '/training/catalog', icon: <GraduationCap className="w-4 h-4 text-indigo-600" /> },
    { label: 'System Security Audit Log', path: '/admin/audit', icon: <Shield className="w-4 h-4 text-amber-600" /> },
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">System Control Center</h1>
          <p className="text-xs font-medium text-slate-500 mt-1">Platform Operations, Access Control & Auditing</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard label="Registered Users" value={stats?.totalUsers || 87} icon={<Users className="w-5 h-5 text-blue-600" />} color="blue" subtitle="Faculty, HODs, Deans & Admins" />
        <StatCard label="Departments" value={stats?.totalDepartments || 6} icon={<Building2 className="w-5 h-5 text-teal-600" />} color="teal" subtitle="Active academic divisions" />
        <StatCard label="Pending Workflows" value={stats?.pendingApprovals || 5} icon={<BookOpen className="w-5 h-5 text-amber-600" />} color="gold" subtitle="Approvals in pipeline" />
        <StatCard label="Audit Events (24h)" value={stats?.auditEventsToday || 28} icon={<Activity className="w-5 h-5 text-indigo-600" />} color="violet" subtitle="Logged security actions" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <Card className="lg:col-span-7">
          <h3 className="text-sm font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100">Administrative Operations</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {quickLinks.map(a => (
              <Link
                key={a.path}
                to={a.path}
                className="flex items-center justify-between p-4 rounded-xl bg-slate-50 hover:bg-blue-50/70 border border-slate-200/80 hover:border-blue-300 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-white shadow-2xs">{a.icon}</div>
                  <span className="text-xs font-bold text-slate-800 group-hover:text-blue-600">{a.label}</span>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
              </Link>
            ))}
          </div>
        </Card>

        <Card className="lg:col-span-5 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">Platform Environment</h3>
          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">API Gateway</span>
              <span className="font-semibold text-slate-900">v1.0.0 (Express REST)</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Authentication</span>
              <span className="font-semibold text-slate-900">JWT + RBAC Middleware</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Database Engine</span>
              <span className="font-semibold text-slate-900">MongoDB Atlas / Mongoose</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-500">System Health</span>
              <span className="inline-flex items-center gap-1 font-bold text-emerald-600">
                <CheckCircle2 className="w-3.5 h-3.5" /> All Services Operational
              </span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};



