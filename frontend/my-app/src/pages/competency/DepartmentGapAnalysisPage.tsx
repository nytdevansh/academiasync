import React, { useEffect, useState } from 'react';
import {
  TrendingUp, AlertTriangle, CheckCircle2, UserCheck,
  Building2, Search, Filter, Award, ArrowUpRight, ArrowDownRight, Minus
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { SearchBar } from '../../components/ui/SearchBar';
import { Modal } from '../../components/ui/Modal';
import { FormField } from '../../components/ui/FormField';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { getGapAnalysis, assessCompetency, getSkillAreas } from '../../api/competency';
import { getAllDepartments } from '../../api/departments';
import { useAuth } from '../../context/AuthContext';
import type { Department, SkillArea, CompetencyLevel } from '../../types';
import {
  COMPETENCY_LEVEL_LABELS, COMPETENCY_LEVEL_PERCENT
} from '../../utils/constants';

const getCompetencyBadgeVariant = (level: string): 'danger' | 'warning' | 'info' | 'violet' | 'success' | 'muted' => {
  switch (level) {
    case 'expert': return 'success';
    case 'advanced': return 'violet';
    case 'proficient': return 'info';
    case 'developing': return 'warning';
    case 'beginner': return 'danger';
    default: return 'muted';
  }
};

export const DepartmentGapAnalysisPage: React.FC = () => {
  const { user } = useAuth();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDeptId, setSelectedDeptId] = useState<string>('');
  const [records, setRecords] = useState<any[]>([]);
  const [skillAreas, setSkillAreas] = useState<SkillArea[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [skillFilter, setSkillFilter] = useState('');

  // Assessment Modal State
  const [assessModalOpen, setAssessModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any | null>(null);
  const [evalScore, setEvalScore] = useState<number>(75);
  const [currentLevel, setCurrentLevel] = useState<CompetencyLevel>('proficient');
  const [targetLevel, setTargetLevel] = useState<CompetencyLevel>('advanced');
  const [gapsInput, setGapsInput] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize departments
  useEffect(() => {
    Promise.all([getAllDepartments(), getSkillAreas()])
      .then(([deptRes, skillRes]) => {
        if (deptRes.success && deptRes.data) {
          setDepartments(deptRes.data);
          if (user?.department) {
            const userDeptId = typeof user.department === 'string' ? user.department : (user.department as any)._id;
            setSelectedDeptId(userDeptId);
          } else if (deptRes.data.length > 0) {
            setSelectedDeptId(deptRes.data[0]._id);
          }
        }
        if (skillRes.success && skillRes.data) {
          setSkillAreas(skillRes.data);
        }
      })
      .catch(console.error);
  }, [user]);

  const loadData = async (deptId: string) => {
    if (!deptId) return;
    try {
      setLoading(true);
      const res = await getGapAnalysis(deptId);
      if (res.success && res.data) {
        setRecords(res.data);
      } else {
        setRecords([]);
      }
    } catch (err: any) {
      console.error('Failed to load gap analysis', err);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedDeptId) {
      loadData(selectedDeptId);
    }
  }, [selectedDeptId]);

  const handleOpenAssessModal = (record: any) => {
    setSelectedRecord(record);
    setEvalScore(record.currentScore || 70);
    setCurrentLevel(record.currentLevel || 'proficient');
    setTargetLevel(record.targetLevel || 'advanced');
    setGapsInput(record.gapsIdentified?.join(', ') || '');
    setNotes(record.notes || '');
    setError(null);
    setAssessModalOpen(true);
  };

  const handleSaveAssessment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecord) return;

    setSubmitting(true);
    setError(null);
    try {
      const gapsArray = gapsInput
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);

      await assessCompetency(selectedRecord._id, {
        currentLevel,
        targetLevel,
        score: Number(evalScore),
        gapsIdentified: gapsArray,
        notes,
      });

      setAssessModalOpen(false);
      await loadData(selectedDeptId);
    } catch (err: any) {
      setError(err?.response?.data?.error || err.message || 'Failed to submit competency assessment');
    } finally {
      setSubmitting(false);
    }
  };

  const currentDept = departments.find(d => d._id === selectedDeptId);

  // Filtered records
  const filteredRecords = records.filter(r => {
    const facultyName = r.userId?.name || '';
    const skillName = r.skillArea?.name || '';
    const matchesSearch = facultyName.toLowerCase().includes(search.toLowerCase()) ||
      skillName.toLowerCase().includes(search.toLowerCase());
    const matchesSkill = skillFilter === '' || r.skillArea?.name === skillFilter;
    return matchesSearch && matchesSkill;
  });

  // KPI Metrics
  const uniqueFaculty = Array.from(new Set(records.map(r => r.userId?._id || r.userId?.name)));
  const totalGaps = records.filter(r => r.hasGap).length;
  const criticalGaps = records.filter(r => (r.gap || 0) >= 2).length;
  const avgScore = records.length > 0
    ? Math.round(records.reduce((acc, r) => acc + (r.currentScore || COMPETENCY_LEVEL_PERCENT[r.currentLevel] || 60), 0) / records.length)
    : 0;

  // Chart aggregation: average current vs target score per skill area
  const skillAggregates: Record<string, { currentSum: number; targetSum: number; count: number }> = {};
  records.forEach(r => {
    const name = r.skillArea?.name || 'General';
    if (!skillAggregates[name]) {
      skillAggregates[name] = { currentSum: 0, targetSum: 0, count: 0 };
    }
    const cVal = r.currentScore || COMPETENCY_LEVEL_PERCENT[r.currentLevel] || 50;
    const tVal = COMPETENCY_LEVEL_PERCENT[r.targetLevel] || 80;
    skillAggregates[name].currentSum += cVal;
    skillAggregates[name].targetSum += tVal;
    skillAggregates[name].count += 1;
  });

  const chartData = Object.keys(skillAggregates).map(name => ({
    name: name.length > 18 ? name.substring(0, 16) + '...' : name,
    fullName: name,
    'Current Level': Math.round(skillAggregates[name].currentSum / skillAggregates[name].count),
    'Target Benchmark': Math.round(skillAggregates[name].targetSum / skillAggregates[name].count),
  }));

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Department Competency Gap Analysis</h1>
          <p className="text-xs font-medium text-slate-500 mt-1">
            Analyze skill deficits, target milestones, and conduct direct faculty competency assessments
          </p>
        </div>

        {/* Department Switcher */}
        {['dean', 'administrator'].includes(user?.role || '') ? (
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
        ) : (
          <Badge variant="teal" className="px-3 py-1 text-xs">
            <Building2 className="w-3.5 h-3.5 mr-1.5 inline" />
            {currentDept ? `${currentDept.name} (${currentDept.code})` : 'My Department'}
          </Badge>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 border-slate-200">
          <div className="text-xs font-medium text-slate-500">Evaluated Faculty</div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">{uniqueFaculty.length}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Faculty members assessed</div>
        </Card>

        <Card className="p-4 border-amber-200 bg-amber-50/20">
          <div className="text-xs font-medium text-amber-700">Skill Deficits</div>
          <div className="text-2xl font-extrabold text-amber-800 mt-1">{totalGaps}</div>
          <div className="text-[11px] text-amber-600 mt-0.5">Records below target level</div>
        </Card>

        <Card className="p-4 border-rose-200 bg-rose-50/20">
          <div className="text-xs font-medium text-rose-700">Critical Priority Gaps</div>
          <div className="text-2xl font-extrabold text-rose-800 mt-1">{criticalGaps}</div>
          <div className="text-[11px] text-rose-600 mt-0.5">Deficit ≥ 2 proficiency tiers</div>
        </Card>

        <Card className="p-4 border-blue-200 bg-blue-50/20">
          <div className="text-xs font-medium text-blue-700">Department Index</div>
          <div className="text-2xl font-extrabold text-blue-800 mt-1">{avgScore}%</div>
          <div className="text-[11px] text-blue-600 mt-0.5">Average proficiency score</div>
        </Card>
      </div>

      {/* Competency Gap Comparison Chart */}
      {chartData.length > 0 && (
        <Card className="p-5 border-slate-200 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Skill Area Gap Distribution</h3>
              <p className="text-xs text-slate-500">Aggregate Current Proficiency vs Institutional Target Benchmarks</p>
            </div>
            <Badge variant="teal">Department Benchmark</Badge>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748B' }} angle={-15} textAnchor="end" />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748B' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: '12px' }}
                  formatter={(val: any, name: any) => [`${val}%`, name]}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Bar dataKey="Current Level" fill="#2563EB" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Target Benchmark" fill="#0F766E" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
        <div className="w-full sm:w-80">
          <SearchBar value={search} onChange={setSearch} placeholder="Search faculty or skill area..." />
        </div>

        <select
          value={skillFilter}
          onChange={e => setSkillFilter(e.target.value)}
          className="w-full sm:w-auto px-3.5 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
        >
          <option value="">All Skill Areas</option>
          {skillAreas.map(s => (
            <option key={s._id} value={s.name}>{s.name}</option>
          ))}
        </select>
      </div>

      {/* Faculty Gap Roster Matrix */}
      {loading ? (
        <LoadingSpinner text="Analyzing department competency records..." />
      ) : filteredRecords.length === 0 ? (
        <EmptyState
          title="No Competency Records Found"
          description="Try adjusting your search query or selecting a different department."
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Faculty Member</th>
                  <th className="px-5 py-3.5">Competency Skill Area</th>
                  <th className="px-5 py-3.5">Current Level</th>
                  <th className="px-5 py-3.5">Target Level</th>
                  <th className="px-5 py-3.5">Gap Status</th>
                  <th className="px-5 py-3.5 text-center">Trend</th>
                  <th className="px-5 py-3.5 text-right whitespace-nowrap">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRecords.map(record => {
                  const faculty = record.userId;
                  const skill = record.skillArea;
                  const gap = record.gap || 0;

                  return (
                    <tr key={record._id} className="hover:bg-slate-50/60 transition-colors">
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
                        <div className="font-bold text-slate-900">{skill?.name || 'Skill Area'}</div>
                        <div className="text-[11px] text-slate-500">{skill?.category || 'Domain'}</div>
                        {record.gapsIdentified && record.gapsIdentified.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {record.gapsIdentified.slice(0, 2).map((g: string, i: number) => (
                              <span key={i} className="text-[10px] bg-rose-50 text-rose-700 px-1.5 py-0.5 rounded border border-rose-100">
                                {g}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>

                      <td className="px-5 py-3.5">
                        <div className="space-y-1">
                          <Badge variant={getCompetencyBadgeVariant(record.currentLevel)}>
                            {COMPETENCY_LEVEL_LABELS[record.currentLevel as CompetencyLevel] || record.currentLevel}
                          </Badge>
                          <div className="text-[11px] font-bold text-slate-600">
                            Score: {record.currentScore || COMPETENCY_LEVEL_PERCENT[record.currentLevel as CompetencyLevel] || 60}/100
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-3.5">
                        <Badge variant="muted">
                          {COMPETENCY_LEVEL_LABELS[record.targetLevel as CompetencyLevel] || record.targetLevel}
                        </Badge>
                      </td>

                      <td className="px-5 py-3.5">
                        {gap >= 2 ? (
                          <Badge variant="danger">
                            -{gap} Tiers (Critical Gap)
                          </Badge>
                        ) : gap === 1 ? (
                          <Badge variant="warning">
                            -1 Tier Deficit
                          </Badge>
                        ) : (
                          <Badge variant="success">
                            Target Achieved ✓
                          </Badge>
                        )}
                      </td>

                      <td className="px-5 py-3.5 text-center whitespace-nowrap">
                        {record.trend === 'improving' ? (
                          <span className="inline-flex items-center gap-0.5 text-emerald-600 font-bold text-[11px]">
                            <ArrowUpRight className="w-3.5 h-3.5" /> Improving
                          </span>
                        ) : record.trend === 'declining' ? (
                          <span className="inline-flex items-center gap-0.5 text-rose-600 font-bold text-[11px]">
                            <ArrowDownRight className="w-3.5 h-3.5" /> Declining
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-0.5 text-slate-500 font-medium text-[11px]">
                            <Minus className="w-3.5 h-3.5" /> Stable
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-3.5 text-right whitespace-nowrap">
                        <Button
                          variant="outline"
                          size="sm"
                          icon={<Award className="w-3.5 h-3.5" />}
                          onClick={() => handleOpenAssessModal(record)}
                        >
                          Assess
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Direct Assessment Modal */}
      {selectedRecord && (
        <Modal
          open={assessModalOpen}
          onClose={() => setAssessModalOpen(false)}
          title={`Conduct Competency Assessment: ${selectedRecord.userId?.name}`}
          size="md"
        >
          <form onSubmit={handleSaveAssessment} className="space-y-4">
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
                {error}
              </div>
            )}

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <span className="text-slate-500 font-medium">Target Competency Domain:</span>
              <div className="font-bold text-slate-900 mt-0.5">
                {selectedRecord.skillArea?.name} ({selectedRecord.skillArea?.category})
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormField label="Assessed Proficiency Level" required>
                <select
                  value={currentLevel}
                  onChange={e => setCurrentLevel(e.target.value as CompetencyLevel)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                >
                  <option value="beginner">Beginner</option>
                  <option value="developing">Developing</option>
                  <option value="proficient">Proficient</option>
                  <option value="advanced">Advanced</option>
                  <option value="expert">Expert</option>
                </select>
              </FormField>

              <FormField label="Development Target Level" required>
                <select
                  value={targetLevel}
                  onChange={e => setTargetLevel(e.target.value as CompetencyLevel)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                >
                  <option value="beginner">Beginner</option>
                  <option value="developing">Developing</option>
                  <option value="proficient">Proficient</option>
                  <option value="advanced">Advanced</option>
                  <option value="expert">Expert</option>
                </select>
              </FormField>
            </div>

            <FormField label="Evaluator Calibrated Score (0 - 100)" required>
              <input
                type="number"
                min={0}
                max={100}
                required
                value={evalScore}
                onChange={e => setEvalScore(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
            </FormField>

            <FormField label="Identified Skill Gaps (Comma-separated)">
              <input
                type="text"
                value={gapsInput}
                onChange={e => setGapsInput(e.target.value)}
                placeholder="e.g. Deep Neural Nets, Grant Writing, CO-PO Direct Attainment"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
            </FormField>

            <FormField label="Evaluator Notes & Actionable Recommendations">
              <textarea
                rows={3}
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Specific recommendations for upcoming workshops or certifications..."
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
            </FormField>

            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 pt-2 border-t border-slate-200">
              <Button type="button" variant="ghost" onClick={() => setAssessModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" loading={submitting}>
                Save Evaluator Assessment
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
