import React, { useEffect, useState } from 'react';
import { Download, BarChart2, TrendingUp, Users, Award, BookOpen } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { ControlledTabs } from '../../components/ui/Tabs';
import { getTrainingParticipation, getCompetencySummary, getAppraisalScores, getFacultyOverview } from '../../api/reports';
import { CHART_COLORS } from '../../utils/constants';
import { useAuth } from '../../context/AuthContext';

export const ReportsPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('training');
  const [loading, setLoading] = useState(false);
  const [trainingData, setTrainingData] = useState<any>(null);
  const [competencyData, setCompetencyData] = useState<any>(null);
  const [appraisalData, setAppraisalData] = useState<any>(null);
  const [overviewData, setOverviewData] = useState<any>(null);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const results = await Promise.allSettled([
          getTrainingParticipation(), getCompetencySummary(), getAppraisalScores(),
          (user?.role === 'dean' || user?.role === 'administrator') ? getFacultyOverview() : Promise.resolve({ success: false }),
        ]);
        if (results[0].status === 'fulfilled' && results[0].value.success) setTrainingData(results[0].value.data);
        if (results[1].status === 'fulfilled' && results[1].value.success) setCompetencyData(results[1].value.data);
        if (results[2].status === 'fulfilled' && results[2].value.success) setAppraisalData(results[2].value.data);
        if (results[3].status === 'fulfilled' && (results[3].value as any).success) setOverviewData((results[3].value as any).data);
      } catch { } finally { setLoading(false); }
    };
    fetchAll();
  }, []);

  const tabs = [
    { id: 'training', label: 'Training & FDP Participation' },
    { id: 'competency', label: 'Skill Matrix & Competency' },
    { id: 'appraisal', label: 'Appraisal Analytics' },
    ...(user?.role === 'dean' || user?.role === 'administrator' ? [{ id: 'overview', label: 'Department Overview' }] : []),
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Institutional Reports & Analytics</h1>
          <p className="text-xs font-medium text-slate-500 mt-1">
            Data-driven intelligence on faculty capacity building, appraisals, and department distribution
          </p>
        </div>
        <Button variant="outline" size="sm" icon={<Download className="w-3.5 h-3.5" />} onClick={() => window.print()}>
          Export Analytics PDF
        </Button>
      </div>

      <ControlledTabs tabs={tabs} active={activeTab} onChange={setActiveTab} />

      <div className="space-y-6">
        {loading && <LoadingSpinner text="Compiling institutional analytics..." />}

        {activeTab === 'training' && !loading && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <Card className="lg:col-span-7">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Enrollment Status Metrics</h3>
                  <p className="text-xs text-slate-500">Breakdown across all faculty development programs</p>
                </div>
              </div>
              {trainingData?.statusBreakdown && trainingData.statusBreakdown.length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={trainingData.statusBreakdown.map((s: any) => ({ name: s._id, count: s.count }))} barSize={34}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                    <XAxis dataKey="name" tick={{ fill: '#64748B', fontSize: 11 }} />
                    <YAxis tick={{ fill: '#64748B', fontSize: 11 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0' }} />
                    <Bar dataKey="count" fill="#2563EB" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState title="No enrollment records" description="No faculty training enrollments have been recorded yet." />
              )}
            </Card>

            <Card className="lg:col-span-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Department Participation</h3>
                  <p className="text-xs text-slate-500">Distribution of FDP engagement</p>
                </div>
              </div>
              {trainingData?.departmentParticipation && trainingData.departmentParticipation.length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={trainingData.departmentParticipation} cx="50%" cy="50%" outerRadius={90} innerRadius={50} dataKey="value" paddingAngle={3}>
                      {trainingData.departmentParticipation.map((_: any, i: number) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0' }} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', color: '#64748B' }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState title="No departmental data" description="Departmental participation will appear once enrollments are recorded." />
              )}
            </Card>
          </div>
        )}

        {activeTab === 'competency' && !loading && (
          <Card>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Competency Levels by Core Skill Area</h3>
                <p className="text-xs text-slate-500">Faculty proficiency index across foundational domains</p>
              </div>
            </div>
            {competencyData && Array.isArray(competencyData) && competencyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={competencyData} barSize={20}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis dataKey="skill" tick={{ fill: '#64748B', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#64748B', fontSize: 11 }} />
                  <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0' }} />
                  <Legend wrapperStyle={{ fontSize: '11px', color: '#64748B' }} />
                  {['beginner', 'developing', 'proficient', 'advanced', 'expert'].map((level, i) => (
                    <Bar key={level} dataKey={level} fill={CHART_COLORS[i]} stackId="a" name={level.toUpperCase()} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState title="No competency metrics" description="Competency evaluations and skill gap metrics have not been recorded yet." />
            )}
          </Card>
        )}

        {activeTab === 'appraisal' && !loading && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <Card className="lg:col-span-7">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Appraisal Score Distribution</h3>
                  <p className="text-xs text-slate-500">Overall score brackets for active cycle</p>
                </div>
              </div>
              {appraisalData?.scoreDistribution && appraisalData.scoreDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={appraisalData.scoreDistribution} barSize={38}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                    <XAxis dataKey="range" tick={{ fill: '#64748B', fontSize: 11 }} />
                    <YAxis tick={{ fill: '#64748B', fontSize: 11 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0' }} />
                    <Bar dataKey="count" name="Faculty Count" fill="#0F766E" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState title="No score distribution" description="Completed appraisals will populate the score distribution." />
              )}
            </Card>

            <Card className="lg:col-span-5 space-y-4">
              <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">Cycle Summary Metrics</h3>
              <div className="space-y-3 text-xs">
                {[
                  { label: 'Total Appraisals Evaluated', value: `${appraisalData?.totalEvaluated || 0} Faculty` },
                  { label: 'Institutional Average Score', value: appraisalData?.avgScore ? `${appraisalData.avgScore}%` : 'N/A' },
                  { label: 'Top Performers (>90%)', value: `${appraisalData?.topPerformers || 0} Faculty` },
                  { label: 'Development Plans Assigned', value: `${appraisalData?.actionPlansAssigned || 0} Faculty` },
                ].map(item => (
                  <div key={item.label} className="flex justify-between py-2 border-b border-slate-100">
                    <span className="text-slate-500">{item.label}</span>
                    <span className="font-bold text-slate-900">{item.value}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'overview' && !loading && (
          <Card>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Faculty Headcount by Academic School</h3>
                <p className="text-xs text-slate-500">Autonomous departments and active faculty totals</p>
              </div>
            </div>
            {overviewData?.facultyByDepartment && overviewData.facultyByDepartment.length > 0 ? (
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={overviewData.facultyByDepartment} layout="vertical" barSize={18}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis type="number" tick={{ fill: '#64748B', fontSize: 11 }} />
                  <YAxis dataKey="deptName" type="category" width={60} tick={{ fill: '#64748B', fontSize: 11 }} />
                  <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0' }} />
                  <Bar dataKey="count" name="Faculty Count" fill="#2563EB" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState title="No department breakdown" description="Department faculty counts will appear here once faculty are assigned." />
            )}
          </Card>
        )}
      </div>
    </div>
  );
};