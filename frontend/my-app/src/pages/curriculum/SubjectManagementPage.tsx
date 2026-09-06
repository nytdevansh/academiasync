import React, { useEffect, useState } from 'react';
import {
  BookOpen, Plus, Edit2, Trash2, Search, Building2,
  AlertTriangle, CheckCircle2, Layers, Award
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { SearchBar } from '../../components/ui/SearchBar';
import { Modal } from '../../components/ui/Modal';
import { FormField } from '../../components/ui/FormField';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { getAllSubjects, createSubject, updateSubject, deleteSubject } from '../../api/subjects';
import { getAllDepartments } from '../../api/departments';
import { useAuth } from '../../context/AuthContext';
import type { Subject, Department } from '../../types';

export const SubjectManagementPage: React.FC = () => {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');

  // Create / Edit Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form Fields
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [credits, setCredits] = useState<number>(3);
  const [description, setDescription] = useState('');

  // Deactivate Confirmation Modal State
  const [deleteConfirm, setDeleteConfirm] = useState<Subject | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [subjRes, deptRes] = await Promise.all([getAllSubjects(), getAllDepartments()]);
      if (subjRes.success && subjRes.data) {
        setSubjects(subjRes.data);
      }
      if (deptRes.success && deptRes.data) {
        setDepartments(deptRes.data);
        if (user?.department && user.role === 'hod') {
          const userDeptId = typeof user.department === 'string' ? user.department : (user.department as any)._id;
          setDeptFilter(userDeptId);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load subjects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleOpenCreateModal = () => {
    setEditingSubject(null);
    setCode('');
    setName('');
    const defaultDept = deptFilter || (user?.department ? (typeof user.department === 'string' ? user.department : (user.department as any)._id) : (departments[0]?._id || ''));
    setDepartmentId(defaultDept);
    setCredits(3);
    setDescription('');
    setError(null);
    setModalOpen(true);
  };

  const handleOpenEditModal = (subject: Subject) => {
    setEditingSubject(subject);
    setCode(subject.code);
    setName(subject.name);
    const dId = subject.department ? (typeof subject.department === 'string' ? subject.department : (subject.department as any)._id) : '';
    setDepartmentId(dId);
    setCredits(subject.credits || 3);
    setDescription(subject.description || '');
    setError(null);
    setModalOpen(true);
  };

  const handleSaveSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !name.trim() || !departmentId) {
      setError('Please fill in Subject Code, Name, and select a Department.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        code: code.trim().toUpperCase(),
        name: name.trim(),
        department: departmentId as any,
        credits: Number(credits) || 3,
        description: description.trim() || undefined,
      };

      if (editingSubject) {
        await updateSubject(editingSubject._id, payload);
      } else {
        await createSubject(payload);
      }

      setModalOpen(false);
      await loadData();
    } catch (err: any) {
      setError(err?.response?.data?.error || err.message || 'Failed to save course subject');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeactivate = async () => {
    if (!deleteConfirm) return;
    setDeleting(true);
    try {
      await deleteSubject(deleteConfirm._id);
      setDeleteConfirm(null);
      await loadData();
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Failed to deactivate subject');
    } finally {
      setDeleting(false);
    }
  };

  const filteredSubjects = subjects.filter(s => {
    const sDeptId = s.department ? (typeof s.department === 'string' ? s.department : (s.department as any)._id) : '';
    const matchesDept = deptFilter === '' || sDeptId === deptFilter;
    const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.code.toLowerCase().includes(search.toLowerCase());
    return matchesDept && matchesSearch;
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Curriculum & Subject Catalog</h1>
          <p className="text-xs font-medium text-slate-500 mt-1">
            Maintain institutional academic courses, credit frameworks, and department mappings
          </p>
        </div>

        {['administrator', 'hod'].includes(user?.role || '') && (
          <Button variant="primary" icon={<Plus className="w-4 h-4" />} onClick={handleOpenCreateModal}>
            Add New Subject
          </Button>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 border-slate-200 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-slate-900">{subjects.length}</div>
            <div className="text-xs font-medium text-slate-500">Total Approved Subjects</div>
          </div>
        </Card>

        <Card className="p-4 border-teal-200 bg-teal-50/20 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-600">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-teal-800">{departments.length}</div>
            <div className="text-xs font-medium text-teal-600">Academic Departments</div>
          </div>
        </Card>

        <Card className="p-4 border-slate-200 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-slate-900">{filteredSubjects.length}</div>
            <div className="text-xs font-medium text-slate-500">Filtered View Count</div>
          </div>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
        <div className="w-full sm:w-80">
          <SearchBar value={search} onChange={setSearch} placeholder="Search by course code or title..." />
        </div>

        <select
          value={deptFilter}
          onChange={e => setDeptFilter(e.target.value)}
          className="w-full sm:w-auto px-3.5 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
        >
          <option value="">All Academic Departments</option>
          {departments.map(dept => (
            <option key={dept._id} value={dept._id}>
              {dept.name} ({dept.code})
            </option>
          ))}
        </select>
      </div>

      {/* Subjects Roster */}
      {loading ? (
        <LoadingSpinner text="Loading curriculum subjects..." />
      ) : filteredSubjects.length === 0 ? (
        <EmptyState
          title="No Subjects Found"
          description="Try adjusting your filter or create a new curriculum subject."
          action={
            ['administrator', 'hod'].includes(user?.role || '') ? (
              <Button variant="primary" onClick={handleOpenCreateModal}>Add New Subject</Button>
            ) : undefined
          }
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[650px]">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Subject Code</th>
                  <th className="px-5 py-3.5">Course Title</th>
                  <th className="px-5 py-3.5">Department</th>
                  <th className="px-5 py-3.5 text-center">Credits</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSubjects.map(subject => {
                  const dept = subject.department as any;
                  return (
                    <tr key={subject._id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-5 py-3.5 font-mono font-bold text-blue-600">
                        {subject.code}
                      </td>

                      <td className="px-5 py-3.5">
                        <div className="font-bold text-slate-900">{subject.name}</div>
                        {subject.description && (
                          <div className="text-[11px] text-slate-500 line-clamp-1 max-w-md mt-0.5">
                            {subject.description}
                          </div>
                        )}
                      </td>

                      <td className="px-5 py-3.5">
                        <span className="font-medium text-slate-700">
                          {dept?.name || 'Department'}
                        </span>
                        {dept?.code && (
                          <span className="text-[11px] text-slate-400 ml-1">({dept.code})</span>
                        )}
                      </td>

                      <td className="px-5 py-3.5 text-center">
                        <Badge variant="teal">{subject.credits} Credits</Badge>
                      </td>

                      <td className="px-5 py-3.5">
                        <Badge variant={subject.isActive ? 'success' : 'muted'}>
                          {subject.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>

                      <td className="px-5 py-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {['administrator', 'hod'].includes(user?.role || '') && (
                            <Button
                              variant="ghost"
                              size="sm"
                              icon={<Edit2 className="w-3.5 h-3.5" />}
                              onClick={() => handleOpenEditModal(subject)}
                              title="Edit Subject"
                            />
                          )}
                          {user?.role === 'administrator' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              icon={<Trash2 className="w-3.5 h-3.5 text-rose-500" />}
                              onClick={() => setDeleteConfirm(subject)}
                              title="Deactivate Subject"
                            />
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create / Edit Subject Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingSubject ? `Edit Subject: ${editingSubject.code}` : 'Add New Curriculum Subject'}
        size="md"
      >
        <form onSubmit={handleSaveSubject} className="space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <FormField label="Subject Code" required hint="e.g. CSE301">
                <input
                  type="text"
                  required
                  value={code}
                  onChange={e => setCode(e.target.value.toUpperCase())}
                  placeholder="CSE301"
                  className="w-full px-3 py-2 text-xs font-mono uppercase bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </FormField>
            </div>

            <div className="sm:col-span-2">
              <FormField label="Subject Name" required>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Design & Analysis of Algorithms"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </FormField>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="Academic Department" required>
              <select
                required
                value={departmentId}
                onChange={e => setDepartmentId(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              >
                <option value="">Select Department</option>
                {departments.map(d => (
                  <option key={d._id} value={d._id}>
                    {d.name} ({d.code})
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Course Credits" required>
              <input
                type="number"
                min={1}
                max={10}
                required
                value={credits}
                onChange={e => setCredits(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
            </FormField>
          </div>

          <FormField label="Subject Description & Course Outline">
            <textarea
              rows={3}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Brief course objectives, prerequisite syllabus, and outcomes..."
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            />
          </FormField>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={submitting}>
              {editingSubject ? 'Save Changes' : 'Create Subject'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Deactivate Confirmation Modal */}
      <Modal
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Deactivate Curriculum Subject"
        size="sm"
      >
        <div className="space-y-4">
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 space-y-1">
            <div className="font-bold flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              Confirm Soft Deactivation
            </div>
            <p>
              Deactivating this subject removes it from active semester allocations while maintaining existing faculty workload histories and syllabus references.
            </p>
          </div>

          <p className="text-xs text-slate-600">
            Subject: <strong className="text-slate-900">{deleteConfirm?.code} – {deleteConfirm?.name}</strong>
          </p>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
            <Button variant="ghost" size="sm" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
            <Button
              variant="primary"
              size="sm"
              loading={deleting}
              className="bg-rose-600 hover:bg-rose-700"
              onClick={handleDeactivate}
            >
              Confirm Deactivation
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
