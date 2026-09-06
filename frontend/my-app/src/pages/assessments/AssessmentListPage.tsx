import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Plus,
  Search,
  CheckCircle2,
  Clock,
  Calendar,
  Layers,
  Award,
  BarChart2,
  Lock,
  EyeOff,
  Star,
  Play,
  RotateCcw,
  Trash2,
  Edit,
  Bookmark,
  Share2,
  Sparkles,
  HelpCircle,
  FileText,
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { ControlledTabs } from '../../components/ui/Tabs';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { Pagination } from '../../components/ui/Pagination';
import { AssessmentBuilderModal } from './AssessmentBuilderModal';
import {
  getAssessments,
  createAssessment,
  updateAssessment,
  deleteAssessment,
  publishAssessment,
  closeAssessment,
} from '../../api/assessments';
import { useAuth } from '../../context/AuthContext';
import {
  ASSESSMENT_STATUS_COLORS,
  ASSESSMENT_STATUS_LABELS,
  ASSESSMENT_TOPICS,
} from '../../utils/constants';
import type { Assessment } from '../../types';

export const AssessmentListPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [selectedTopic, setSelectedTopic] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);

  // Modal State
  const [builderOpen, setBuilderOpen] = useState(false);
  const [editingAssessment, setEditingAssessment] = useState<Assessment | null>(null);

  const canCreate = ['hod', 'dean', 'administrator'].includes(user?.role || '');

  const loadAssessments = () => {
    setLoading(true);
    getAssessments()
      .then(res => {
        if (res.success && res.data) {
          setAssessments(res.data);
        }
      })
      .catch(err => {
        console.error('Failed to load assessments:', err);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadAssessments();
  }, []);

  const handleSaveAssessment = async (data: Partial<Assessment>) => {
    if (editingAssessment) {
      await updateAssessment(editingAssessment._id, data);
    } else {
      await createAssessment(data);
    }
    loadAssessments();
  };

  const handlePublish = async (id: string) => {
    if (!confirm('Publish this assessment? Targeted faculty members will receive in-app notifications.')) return;
    try {
      await publishAssessment(id);
      loadAssessments();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to publish assessment');
    }
  };

  const handleClose = async (id: string) => {
    if (!confirm('Close this assessment to prevent new submissions?')) return;
    try {
      await closeAssessment(id);
      loadAssessments();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to close assessment');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this draft assessment permanently?')) return;
    try {
      await deleteAssessment(id);
      loadAssessments();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete assessment');
    }
  };

  const handleCloneTemplate = (template: Assessment) => {
    setEditingAssessment(null);
    setBuilderOpen(true);
  };

  const filterTabs = [
    { id: 'all', label: 'All Assessments' },
    { id: 'graded', label: 'Graded Tests' },
    { id: 'surveys', label: 'Surveys & Feedback' },
    { id: 'mine', label: 'My Submissions' },
    { id: 'templates', label: 'Templates' },
    ...(canCreate ? [{ id: 'drafts', label: 'Drafts' }] : []),
  ];

  const filteredAssessments = assessments.filter(a => {
    const matchesSearch =
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.topic.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesTopic = selectedTopic === 'all' || a.topic === selectedTopic;

    let matchesTab = true;
    if (activeTab === 'graded') matchesTab = a.settings.isGraded && !a.isTemplate;
    else if (activeTab === 'surveys') matchesTab = !a.settings.isGraded && !a.isTemplate;
    else if (activeTab === 'mine') matchesTab = Boolean(a.mySubmission);
    else if (activeTab === 'templates') matchesTab = Boolean(a.isTemplate);
    else if (activeTab === 'drafts') matchesTab = a.status === 'draft';

    return matchesSearch && matchesTopic && matchesTab;
  });
  const totalPages = Math.max(1, Math.ceil(filteredAssessments.length / pageSize));
  const paginatedAssessments = filteredAssessments.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    setPage(1);
  }, [activeTab, selectedTopic, searchQuery, pageSize]);

  return (
    <div className="space-y-6 pb-16 animate-fadeIn">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Assessments & Institutional Surveys
          </h1>
          <p className="text-xs font-medium text-slate-500 mt-1">
            Ad-hoc pedagogical diagnostics, topic evaluations, syllabus readiness checks, and anonymous feedback surveys
          </p>
        </div>

        {canCreate && (
          <Button
            variant="primary"
            onClick={() => {
              setEditingAssessment(null);
              setBuilderOpen(true);
            }}
            icon={<Plus className="w-4 h-4" />}
          >
            Create Assessment / Survey
          </Button>
        )}
      </div>

      {/* Tabs & Search Filter Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <ControlledTabs tabs={filterTabs} active={activeTab} onChange={setActiveTab} />

        <div className="flex items-center gap-2">
          {/* Topic filter */}
          <select
            className="text-xs border border-slate-300 rounded-lg px-2.5 py-2 bg-white text-slate-700 font-medium"
            value={selectedTopic}
            onChange={e => setSelectedTopic(e.target.value)}
          >
            <option value="all">All Topics</option>
            {ASSESSMENT_TOPICS.map(t => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          {/* Search bar */}
          <div className="relative">
            <input
              type="text"
              className="input text-xs pl-8 py-2 w-52"
              placeholder="Search assessment..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          </div>
        </div>
      </div>

      {/* Grid of Assessments */}
      {loading ? (
        <LoadingSpinner text="Loading assessments and surveys..." />
      ) : filteredAssessments.length === 0 ? (
        <EmptyState
          title="No assessments found"
          description="There are currently no assessments or surveys matching your filter criteria."
          action={
            canCreate ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setEditingAssessment(null);
                  setBuilderOpen(true);
                }}
              >
                Create One Now
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {paginatedAssessments.map(item => {
            const isOwner = item.createdBy?._id === user?._id;
            const canManage = ['dean', 'administrator'].includes(user?.role || '') || isOwner;
            const isGraded = item.settings.isGraded;
            const totalPoints = item.questions.reduce((sum, q) => sum + (isGraded ? (q.points || 0) : 0), 0);
            const mySub = item.mySubmission;

            return (
              <Card
                key={item._id}
                className="p-5 flex flex-col justify-between hover:shadow-md transition-all border border-slate-200/90 rounded-2xl group bg-white"
              >
                <div>
                  {/* Top Badges Row */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100">
                      {item.topic}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {item.isTemplate && (
                        <Badge variant="gold" className="flex items-center gap-1">
                          <Bookmark className="w-3 h-3" /> Template
                        </Badge>
                      )}
                      <Badge variant={ASSESSMENT_STATUS_COLORS[item.status] || 'muted'}>
                        {ASSESSMENT_STATUS_LABELS[item.status] || item.status}
                      </Badge>
                    </div>
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-base font-bold text-slate-900 leading-snug group-hover:text-blue-600 transition-colors line-clamp-2">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
                    {item.description || 'No additional description provided.'}
                  </p>

                  {/* Key Metadata Grid */}
                  <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-100 text-xs text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                      <span>{item.questions.length} Questions</span>
                    </div>

                    {isGraded ? (
                      <div className="flex items-center gap-1.5 font-semibold text-emerald-700">
                        <Award className="w-3.5 h-3.5 text-emerald-500" />
                        <span>{totalPoints} Points</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-amber-700 font-semibold">
                        <Star className="w-3.5 h-3.5 text-amber-500" />
                        <span>Survey Mode</span>
                      </div>
                    )}

                    {item.settings.timeLimitMinutes ? (
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{item.settings.timeLimitMinutes} mins</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Untimed</span>
                      </div>
                    )}

                    {item.settings.isAnonymous ? (
                      <div className="flex items-center gap-1.5 text-violet-700 font-medium">
                        <EyeOff className="w-3.5 h-3.5 text-violet-500" />
                        <span>Anonymous</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-slate-500">
                        <Layers className="w-3.5 h-3.5" />
                        <span className="capitalize">{item.targetScope.type}</span>
                      </div>
                    )}
                  </div>

                  {/* Submission Status Highlight */}
                  {mySub && (
                    <div className="mt-3 p-2.5 rounded-xl bg-emerald-50/80 border border-emerald-200/80 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 text-emerald-900 font-bold">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Completed (Attempt #{mySub.attemptNumber})</span>
                      </div>
                      {isGraded && (
                        <span className="font-black text-emerald-700">
                          {mySub.totalScore} / {mySub.maxScore}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Card Action Footer */}
                <div className="mt-5 pt-3 border-t border-slate-100 flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-2">
                    {/* Faculty Action */}
                    {item.status === 'published' && (!mySub || item.settings.allowRetake) ? (
                      <Button
                        variant="primary"
                        size="sm"
                        fullWidth
                        onClick={() => navigate(`/assessments/${item._id}/take`)}
                        icon={<Play className="w-3.5 h-3.5 fill-current" />}
                      >
                        {mySub ? 'Retake Assessment' : 'Take Assessment'}
                      </Button>
                    ) : mySub ? (
                      <Button
                        variant="outline"
                        size="sm"
                        fullWidth
                        onClick={() => navigate(`/assessments/${item._id}/take`)}
                      >
                        View My Results & Feedback
                      </Button>
                    ) : null}

                    {/* Analytics Action for Admins / HOD / Deans */}
                    {canManage && (
                      <Button
                        variant="secondary"
                        size="sm"
                        className={!mySub && item.status !== 'published' ? 'w-full' : ''}
                        onClick={() => navigate(`/assessments/${item._id}/analytics`)}
                        icon={<BarChart2 className="w-3.5 h-3.5" />}
                        title="View analytics & responses"
                      >
                        {item.totalSubmissions || 0} Submissions
                      </Button>
                    )}
                  </div>

                  {/* Management Quick Actions for creator/admin */}
                  {canManage && (
                    <div className="flex items-center justify-end gap-1 text-xs pt-1">
                      {item.status === 'draft' && (
                        <button
                          onClick={() => handlePublish(item._id)}
                          className="px-2 py-1 text-emerald-700 hover:bg-emerald-50 rounded font-semibold transition-colors cursor-pointer"
                        >
                          Publish
                        </button>
                      )}
                      {item.status === 'published' && (
                        <button
                          onClick={() => handleClose(item._id)}
                          className="px-2 py-1 text-rose-700 hover:bg-rose-50 rounded font-semibold transition-colors cursor-pointer"
                        >
                          Close
                        </button>
                      )}
                      {item.status === 'draft' && (
                        <>
                          <button
                            onClick={() => {
                              setEditingAssessment(item);
                              setBuilderOpen(true);
                            }}
                            className="p-1 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded transition-colors"
                            title="Edit Draft"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(item._id)}
                            className="p-1 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                            title="Delete Draft"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
          <Pagination
            page={page}
            totalPages={totalPages}
            pageSize={pageSize}
            totalItems={filteredAssessments.length}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        </div>
      )}

      {/* Builder Modal */}
      {builderOpen && (
        <AssessmentBuilderModal
          open={builderOpen}
          onClose={() => {
            setBuilderOpen(false);
            setEditingAssessment(null);
          }}
          onSave={handleSaveAssessment}
          initialData={editingAssessment}
        />
      )}
    </div>
  );
};
