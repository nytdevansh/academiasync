import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Legend } from 'recharts';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { getMyCompetency, getSkillAreas } from '../../api/competency';
import type { CompetencyRecord, SkillArea } from '../../types';
import { COMPETENCY_LEVEL_COLORS, COMPETENCY_LEVEL_LABELS, COMPETENCY_LEVEL_PERCENT } from '../../utils/constants';
import { useAuth } from '../../context/AuthContext';

export const CompetencyPage: React.FC = () => {
  const { user } = useAuth();
  const [records, setRecords] = useState<CompetencyRecord[]>([]);
  const [skillAreas, setSkillAreas] = useState<SkillArea[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getMyCompetency(), getSkillAreas()])
      .then(([r, s]) => {
        if (r.success && r.data) {
          setRecords(r.data);
        } else {
          setRecords([]);
        }
        if (s.success) setSkillAreas(s.data || []);
      })
      .catch(() => {
        setRecords([]);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner text="Loading competency profile..." />;

  const radarData = records.map(r => ({
    skill: (r.skillArea as any)?.name?.split(' ')[0] || 'Skill',
    current: COMPETENCY_LEVEL_PERCENT[r.currentLevel] || 60,
    target: COMPETENCY_LEVEL_PERCENT[r.targetLevel] || 80,
  }));

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="pb-2 border-b border-slate-200/80">
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Faculty Competency & Skill Radar</h1>
        <p className="text-xs font-medium text-slate-500 mt-1">
          Self-assessment benchmarks, peer calibrations, and developmental target trajectories
        </p>
      </div>

      {records.length === 0 ? (
        <Card className="p-8 text-center">
          <EmptyState
            title="No Competency Records Found"
            description="You have not been evaluated or self-assessed on any skill areas yet. Assessments initiated by your HOD or completed during appraisals will populate your radar."
          />
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Radar Chart */}
        <Card className="lg:col-span-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Competency Spider Radar</h3>
              <p className="text-xs text-slate-500">Current skill index vs target benchmarks</p>
            </div>
            <Badge variant="teal">Matrix</Badge>
          </div>
          <ResponsiveContainer width="100%" height={290}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#E2E8F0" />
              <PolarAngleAxis dataKey="skill" tick={{ fontSize: 11, fill: '#475569' }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10, fill: '#94A3B8' }} />
              <Radar name="Current Index" dataKey="current" stroke="#2563EB" fill="#2563EB" fillOpacity={0.25} />
              <Radar name="Target Milestone" dataKey="target" stroke="#0F766E" fill="#0F766E" fillOpacity={0.15} strokeDasharray="4 4" />
              <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0' }} />
              <Legend wrapperStyle={{ fontSize: '11px', color: '#64748B' }} />
            </RadarChart>
          </ResponsiveContainer>
        </Card>

        {/* Skill Details Breakdown */}
        <Card className="lg:col-span-6">
          <h3 className="text-sm font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100">
            Domain Competencies & Development Gaps
          </h3>
          <div className="space-y-4">
            {records.map(r => (
              <div key={r._id} className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">{(r.skillArea as any)?.name}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant={r.currentLevel === 'expert' ? 'success' : r.currentLevel === 'advanced' ? 'teal' : 'info'}>
                      {COMPETENCY_LEVEL_LABELS[r.currentLevel] || r.currentLevel}
                    </Badge>
                    {r.currentLevel !== r.targetLevel && (
                      <span className="text-[11px] font-semibold text-slate-400">
                        → {COMPETENCY_LEVEL_LABELS[r.targetLevel]}
                      </span>
                    )}
                  </div>
                </div>

                <ProgressBar value={COMPETENCY_LEVEL_PERCENT[r.currentLevel] || 60} variant={r.currentLevel === 'expert' ? 'emerald' : 'blue'} />

                {r.gapsIdentified && r.gapsIdentified.length > 0 && (
                  <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                    <span className="font-semibold text-slate-700">Identified Gaps:</span>
                    <span>{r.gapsIdentified.join(', ')}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Bar Comparison */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Current vs Target Level Metric Comparison</h3>
            <p className="text-xs text-slate-500">Percentage proficiency score mapped against institutional rubrics</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={radarData} barGap={6}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
            <XAxis dataKey="skill" tick={{ fill: '#64748B', fontSize: 11 }} />
            <YAxis domain={[0, 100]} tick={{ fill: '#64748B', fontSize: 11 }} />
            <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0' }} />
            <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', color: '#64748B' }} />
            <Bar dataKey="current" name="Current Proficiency" fill="#2563EB" radius={[4, 4, 0, 0]} barSize={22} />
            <Bar dataKey="target" name="Target Benchmark" fill="#0F766E" radius={[4, 4, 0, 0]} barSize={22} />
          </BarChart>
        </ResponsiveContainer>
      </Card>
      </>
      )}
    </div>
  );
};