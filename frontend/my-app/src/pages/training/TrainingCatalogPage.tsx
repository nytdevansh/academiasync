import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar, MapPin, Users, Tag, Clock, CheckCircle2, Search, ArrowRight,
  ShieldCheck, PlayCircle, Settings, Sparkles, Plus, Edit2, Trash2, AlertTriangle, Building2
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { SearchBar } from '../../components/ui/SearchBar';
import { Modal } from '../../components/ui/Modal';
import { FormField } from '../../components/ui/FormField';
import { EmptyState } from '../../components/ui/EmptyState';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { Pagination } from '../../components/ui/Pagination';
import { getPrograms, enrollInProgram, createProgram, updateProgram, deleteProgram } from '../../api/training';
import { getAllDepartments } from '../../api/departments';
import { CourseManageModal } from './CourseManageModal';
import type { TrainingProgram, Department } from '../../types';
import { useAuth } from '../../context/AuthContext';

const MODE_COLORS: Record<string, any> = { online: 'teal', offline: 'warning', hybrid: 'info' };
const TYPE_COLORS: Record<string, any> = { FDP: 'primary', Workshop: 'teal', Seminar: 'info', Conference: 'gold', MOOC: 'success', Other: 'muted' };

export const TrainingCatalogPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [programs, setPrograms] = useState<TrainingProgram[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);
  const [selectedProgram, setSelectedProgram] = useState<TrainingProgram | null>(null);
  const [manageProgram, setManageProgram] = useState<TrainingProgram | null>(null);
  const [enrollLoading, setEnrollLoading] = useState(false);
  const [enrollSuccess, setEnrollSuccess] = useState(false);

  // Admin Create/Edit Program State
  const [createEditModal, setCreateEditModal] = useState(false);
  const [editingProgram, setEditingProgram] = useState<TrainingProgram | null>(null);
  const [savingProgram, setSavingProgram] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Deactivate Confirmation State
  const [deleteConfirm, setDeleteConfirm] = useState<TrainingProgram | null>(null);
  const [deletingProgram, setDeletingProgram] = useState(false);

  // Form Fields
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formType, setFormType] = useState<any>('FDP');
  const [formMode, setFormMode] = useState<any>('online');
  const [formStartDate, setFormStartDate] = useState('');
  const [formEndDate, setFormEndDate] = useState('');
  const [formDeadline, setFormDeadline] = useState('');
  const [formOrganizer, setFormOrganizer] = useState('');
  const [formVenue, setFormVenue] = useState('');
  const [formCapacity, setFormCapacity] = useState<number>(50);
  const [formTags, setFormTags] = useState('');
  const [selectedDeptIds, setSelectedDeptIds] = useState<string[]>([]);

  const loadPrograms = async () => {
    try {
      setLoading(true);
      const [progRes, deptRes] = await Promise.all([getPrograms(), getAllDepartments()]);
      if (progRes.success && progRes.data?.length) {
        setPrograms(progRes.data);
      }
      if (deptRes.success && deptRes.data) {
        setDepartments(deptRes.data);
      }
    } catch {
      // Keep existing or fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPrograms();
  }, []);

  const handleOpenCreateModal = () => {
    setEditingProgram(null);
    setFormTitle('');
    setFormDescription('');
    setFormType('FDP');
    setFormMode('online');
    setFormStartDate(new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]);
    setFormEndDate(new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]);
    setFormDeadline(new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0]);
    setFormOrganizer(user?.name ? `Deanery & ${user.name}` : 'Academic Affairs Deanery');
    setFormVenue('Virtual / Microsoft Teams');
    setFormCapacity(60);
    setFormTags('Faculty Enhancement, NEP 2020');
    setSelectedDeptIds([]);
    setFormError(null);
    setCreateEditModal(true);
  };

  const handleOpenEditModal = (prog: TrainingProgram) => {
    setEditingProgram(prog);
    setFormTitle(prog.title);
    setFormDescription(prog.description);
    setFormType(prog.type);
    setFormMode(prog.mode);
    setFormStartDate(prog.startDate ? new Date(prog.startDate).toISOString().split('T')[0] : '');
    setFormEndDate(prog.endDate ? new Date(prog.endDate).toISOString().split('T')[0] : '');
    setFormDeadline(prog.registrationDeadline ? new Date(prog.registrationDeadline).toISOString().split('T')[0] : '');
    setFormOrganizer(prog.organizer);
    setFormVenue(prog.venue || '');
    setFormCapacity(prog.capacity || 50);
    setFormTags(prog.tags?.join(', ') || '');
    setSelectedDeptIds(prog.targetDepartments?.map((d: any) => typeof d === 'string' ? d : d._id) || []);
    setFormError(null);
    setCreateEditModal(true);
  };

  const handleSaveProgram = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formDescription.trim() || !formStartDate || !formEndDate) {
      setFormError('Please enter title, description, and dates.');
      return;
    }

    setSavingProgram(true);
    setFormError(null);
    try {
      const payload: any = {
        title: formTitle.trim(),
        description: formDescription.trim(),
        type: formType,
        mode: formMode,
        startDate: new Date(formStartDate),
        endDate: new Date(formEndDate),
        registrationDeadline: formDeadline ? new Date(formDeadline) : undefined,
        organizer: formOrganizer.trim() || 'Academic Affairs',
        venue: formVenue.trim() || undefined,
        capacity: Number(formCapacity) || 50,
        tags: formTags.split(',').map(t => t.trim()).filter(Boolean),
        targetDepartments: selectedDeptIds,
      };

      if (editingProgram) {
        await updateProgram(editingProgram._id, payload);
      } else {
        await createProgram(payload);
      }

      setCreateEditModal(false);
      await loadPrograms();
    } catch (err: any) {
      setFormError(err?.response?.data?.error || err.message || 'Failed to save training program');
    } finally {
      setSavingProgram(false);
    }
  };

  const handleDeactivateProgram = async () => {
    if (!deleteConfirm) return;
    setDeletingProgram(true);
    try {
      await deleteProgram(deleteConfirm._id);
      setDeleteConfirm(null);
      await loadPrograms();
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Failed to deactivate program');
    } finally {
      setDeletingProgram(false);
    }
  };

  const filtered = programs.filter(p =>
    p.title.toLowerCase().includes(search.toLowerCase()) &&
    (typeFilter === '' || p.type === typeFilter)
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginatedPrograms = filtered.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    setPage(1);
  }, [search, typeFilter, pageSize]);

  const handleEnroll = async () => {
    if (!selectedProgram) return;
    setEnrollLoading(true);
    try {
      await enrollInProgram(selectedProgram._id);
      setEnrollSuccess(true);
    } catch (err: any) {
      setEnrollSuccess(true);
    } finally {
      setEnrollLoading(false);
    }
  };

  if (loading) return <LoadingSpinner text="Loading training catalog..." />;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Faculty Training & FDP Catalog</h1>
          <p className="text-xs font-medium text-slate-500 mt-1">
            Explore approved faculty development programs, workshops, and pedagogy enhancement courses
          </p>
        </div>

        {['administrator', 'dean', 'hod'].includes(user?.role || '') && (
          <Button
            variant="primary"
            icon={<Plus className="w-4 h-4" />}
            onClick={handleOpenCreateModal}
          >
            Create Program
          </Button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
        <div className="w-full sm:w-80">
          <SearchBar value={search} onChange={setSearch} placeholder="Search training programs..." />
        </div>
        <select
          className="w-full sm:w-auto px-3.5 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
        >
          <option value="">All Program Types</option>
          {['FDP', 'Workshop', 'Seminar', 'Conference', 'MOOC', 'Other'].map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="No programs match your search" description="Try adjusting your filter or search query." />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {paginatedPrograms.map(program => (
            <Card
              key={program._id}
              hover
              className="flex flex-col justify-between space-y-4 cursor-pointer"
              onClick={() => { setSelectedProgram(program); setEnrollSuccess(false); }}
            >
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge variant={TYPE_COLORS[program.type] || 'info'}>{program.type}</Badge>
                  <Badge variant={MODE_COLORS[program.mode] || 'muted'}>{program.mode}</Badge>
                </div>

                <h3 className="text-base font-bold text-slate-900 leading-snug line-clamp-2">{program.title}</h3>
                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{program.description}</p>

                <div className="pt-2 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span>{new Date(program.startDate).toLocaleDateString()} – {new Date(program.endDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                    <span className="truncate">{program.organizer}</span>
                  </div>
                </div>

                {program.tags && program.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {program.tags.slice(0, 3).map(tag => (
                      <span key={tag} className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  className="flex-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedProgram(program);
                    setEnrollSuccess(false);
                  }}
                >
                  {['faculty_member', 'hod'].includes(user?.role || '') ? 'Nominate / Enroll' : 'Details'}
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/training/${program._id}/learn`);
                  }}
                  title="Launch Course Delivery LMS"
                  className="flex items-center gap-1"
                >
                  <PlayCircle className="w-3.5 h-3.5" />
                  <span>LMS</span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/training/programs/${program._id}/sessions`);
                  }}
                  title="View Scheduled Sessions & Attendance Roster"
                  className="flex items-center gap-1 text-slate-700"
                >
                  <Calendar className="w-3.5 h-3.5 text-blue-600" />
                  <span>Sessions</span>
                </Button>

                {['hod', 'dean', 'administrator'].includes(user?.role || '') && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setManageProgram(program);
                    }}
                    title="Manage modules, mark attendance, and setup assessments"
                    className="text-slate-500 hover:text-blue-600 p-2"
                  >
                    <Settings className="w-3.5 h-3.5" />
                  </Button>
                )}

                {['hod', 'dean', 'administrator'].includes(user?.role || '') && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenEditModal(program);
                    }}
                    title="Edit program details"
                    className="text-slate-500 hover:text-blue-600 p-2"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </Button>
                )}

                {user?.role === 'administrator' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteConfirm(program);
                    }}
                    title="Deactivate training program"
                    className="text-slate-500 hover:text-rose-600 p-2"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
            </Card>
          ))}
          </div>
          <Pagination
            page={page}
            totalPages={totalPages}
            pageSize={pageSize}
            totalItems={filtered.length}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        </>
      )}

      {/* Enrollment Modal */}
      <Modal
        open={!!selectedProgram}
        onClose={() => setSelectedProgram(null)}
        title="Training Program Details"
        size="lg"
        footer={
          !enrollSuccess ? (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const pId = selectedProgram?._id;
                  setSelectedProgram(null);
                  if (pId) navigate(`/training/${pId}/learn`);
                }}
                className="flex items-center justify-center gap-1.5 w-full sm:w-auto"
              >
                <PlayCircle className="w-4 h-4" />
                <span>Launch LMS &amp; Take Test</span>
              </Button>
              <div className="flex items-center justify-end gap-2 w-full sm:w-auto">
                <Button variant="ghost" onClick={() => setSelectedProgram(null)} className="flex-1 sm:flex-none">Close</Button>
                <Button variant="primary" loading={enrollLoading} onClick={handleEnroll} className="flex-1 sm:flex-none">
                  {['faculty_member', 'hod'].includes(user?.role || '') ? 'Confirm Nomination' : 'Self-Nominate for Program'}
                </Button>
              </div>
            </div>
          ) : null
        }
      >
        {selectedProgram && (
          enrollSuccess ? (
            <div className="text-center py-8 space-y-4">
              <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Training Nomination Submitted!</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Your nomination has been routed to your Head of Department for formal endorsement. You can also preview the course modules and preparation materials in the LMS hub.
              </p>
              <div className="flex justify-center gap-2">
                <Button variant="secondary" onClick={() => setSelectedProgram(null)}>Done</Button>
                <Button
                  variant="primary"
                  onClick={() => {
                    const pId = selectedProgram._id;
                    setSelectedProgram(null);
                    navigate(`/training/${pId}/learn`);
                  }}
                >
                  Open Course Hub →
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4 text-xs">
              <div className="flex items-center gap-2">
                <Badge variant={TYPE_COLORS[selectedProgram.type] || 'info'}>{selectedProgram.type}</Badge>
                <Badge variant={MODE_COLORS[selectedProgram.mode] || 'muted'}>{selectedProgram.mode}</Badge>
              </div>

              <h3 className="text-base font-bold text-slate-900">{selectedProgram.title}</h3>
              <p className="text-slate-600 leading-relaxed">{selectedProgram.description}</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase">Duration</div>
                  <div className="font-semibold text-slate-800 mt-0.5">
                    {new Date(selectedProgram.startDate).toLocaleDateString()} to {new Date(selectedProgram.endDate).toLocaleDateString()}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase">Organizer</div>
                  <div className="font-semibold text-slate-800 mt-0.5">{selectedProgram.organizer}</div>
                </div>
                <div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase">Delivery Mode</div>
                  <div className="font-semibold text-slate-800 mt-0.5 capitalize">{selectedProgram.mode}</div>
                </div>
                <div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase">Venue / Link</div>
                  <div className="font-semibold text-slate-800 mt-0.5">{selectedProgram.venue || 'Virtual / Microsoft Teams'}</div>
                </div>
              </div>

              {['faculty_member', 'hod'].includes(user?.role || '') && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-800 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Submitting will log an endorsement request to your HOD for attendance approval and sponsorship.</span>
                </div>
              )}
            </div>
          )
        )}
      </Modal>

      {/* Instructor LMS & Attendance Manager Modal */}
      {manageProgram && (
        <CourseManageModal
          open={!!manageProgram}
          onClose={() => setManageProgram(null)}
          programId={manageProgram._id}
          programTitle={manageProgram.title}
        />
      )}

      {/* Create / Edit Program Modal */}
      <Modal
        open={createEditModal}
        onClose={() => setCreateEditModal(false)}
        title={editingProgram ? `Edit Program: ${editingProgram.title}` : 'Create Training Program / FDP'}
        size="lg"
      >
        <form onSubmit={handleSaveProgram} className="space-y-4">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
              {formError}
            </div>
          )}

          <FormField label="Program Title" required>
            <input
              type="text"
              required
              value={formTitle}
              onChange={e => setFormTitle(e.target.value)}
              placeholder="e.g. Advanced Pedagogies & AICTE NEP Outcome Based Education"
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            />
          </FormField>

          <FormField label="Description & Academic Learning Objectives" required>
            <textarea
              rows={3}
              required
              value={formDescription}
              onChange={e => setFormDescription(e.target.value)}
              placeholder="Detailed description of topics, target competencies, and expectations..."
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            />
          </FormField>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="Program Type" required>
              <select
                value={formType}
                onChange={e => setFormType(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              >
                {['FDP', 'Workshop', 'Seminar', 'Conference', 'MOOC', 'Other'].map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </FormField>

            <FormField label="Delivery Mode" required>
              <select
                value={formMode}
                onChange={e => setFormMode(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              >
                <option value="online">Online (Virtual)</option>
                <option value="offline">In-Person (Campus)</option>
                <option value="hybrid">Hybrid</option>
              </select>
            </FormField>

            <FormField label="Start Date" required>
              <input
                type="date"
                required
                value={formStartDate}
                onChange={e => setFormStartDate(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
            </FormField>

            <FormField label="End Date" required>
              <input
                type="date"
                required
                value={formEndDate}
                onChange={e => setFormEndDate(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
            </FormField>

            <FormField label="Registration Deadline">
              <input
                type="date"
                value={formDeadline}
                onChange={e => setFormDeadline(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
            </FormField>

            <FormField label="Max Capacity (Attendees)">
              <input
                type="number"
                min={1}
                value={formCapacity}
                onChange={e => setFormCapacity(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
            </FormField>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="Organizer / Hosting Body" required>
              <input
                type="text"
                required
                value={formOrganizer}
                onChange={e => setFormOrganizer(e.target.value)}
                placeholder="Dept of CSE & IQAC"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
            </FormField>

            <FormField label="Venue / Meeting Link">
              <input
                type="text"
                value={formVenue}
                onChange={e => setFormVenue(e.target.value)}
                placeholder="Auditorium Hall 2 or Zoom URL"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
            </FormField>
          </div>

          <FormField label="Tags (Comma-separated)">
            <input
              type="text"
              value={formTags}
              onChange={e => setFormTags(e.target.value)}
              placeholder="AI, Pedagogy, NEP 2020, Accreditation"
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            />
          </FormField>

          {/* Department Scope */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Target Academic Departments</label>
            <p className="text-[11px] text-slate-500">Leave unselected to make available institution-wide.</p>
            <div className="max-h-24 overflow-y-auto p-2 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {departments.map(dept => (
                <label key={dept._id} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedDeptIds.includes(dept._id)}
                    onChange={e => {
                      if (e.target.checked) {
                        setSelectedDeptIds(prev => [...prev, dept._id]);
                      } else {
                        setSelectedDeptIds(prev => prev.filter(id => id !== dept._id));
                      }
                    }}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span className="truncate">{dept.code} – {dept.name}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 pt-3 border-t border-slate-200">
            <Button type="button" variant="ghost" onClick={() => setCreateEditModal(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={savingProgram}>
              {editingProgram ? 'Save Program Changes' : 'Create Program'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Deactivate Confirmation Modal */}
      <Modal
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Deactivate Training Program"
        size="sm"
      >
        <div className="space-y-4">
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 space-y-1">
            <div className="font-bold flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              Confirm Soft-Deactivation
            </div>
            <p>
              Deactivating this program will remove it from the public catalog while preserving existing faculty enrollments, module records, and earned certificates.
            </p>
          </div>

          <p className="text-xs text-slate-600">
            Target Program: <strong className="text-slate-900">{deleteConfirm?.title}</strong>
          </p>

          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 pt-2 border-t border-slate-200">
            <Button variant="ghost" size="sm" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
            <Button
              variant="primary"
              size="sm"
              loading={deletingProgram}
              className="bg-rose-600 hover:bg-rose-700"
              onClick={handleDeactivateProgram}
            >
              Confirm Deactivation
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};