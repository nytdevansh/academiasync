import React, { useEffect, useState } from 'react';
import {
  Building2,
  Plus,
  Edit3,
  Trash2,
  Users,
  Search,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  UserCheck,
  Building,
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { SearchBar } from '../../components/ui/SearchBar';
import { Modal } from '../../components/ui/Modal';
import { FormField } from '../../components/ui/FormField';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { EmptyState } from '../../components/ui/EmptyState';
import {
  getAllDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} from '../../api/departments';
import { getAllUsers } from '../../api/users';
import type { Department, User } from '../../types';

export const DepartmentManagementPage: React.FC = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [hodUsers, setHodUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Create Modal State
  const [createModal, setCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '',
    code: '',
    description: '',
    hodRef: '',
  });

  // Edit Modal State
  const [editModal, setEditModal] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    code: '',
    description: '',
    hodRef: '',
  });
  const [updating, setUpdating] = useState(false);

  // Deactivate Modal State
  const [deleteDept, setDeleteDept] = useState<Department | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchData = async () => {
    try {
      const [deptRes, usersRes] = await Promise.all([
        getAllDepartments(),
        getAllUsers(),
      ]);

      if (deptRes.success && deptRes.data) {
        setDepartments(deptRes.data);
      }
      if (usersRes.success && usersRes.data) {
        // Filter users eligible for HOD appointment
        const hods = usersRes.data.filter((u) => u.role === 'hod' || u.role === 'faculty_member');
        setHodUsers(hods);
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async () => {
    if (!createForm.name.trim() || !createForm.code.trim()) {
      alert('Department name and unique code are required.');
      return;
    }
    setCreating(true);
    try {
      const payload: any = {
        name: createForm.name.trim(),
        code: createForm.code.trim().toUpperCase(),
        description: createForm.description.trim() || undefined,
        hodRef: createForm.hodRef || undefined,
      };
      await createDepartment(payload);
      setCreateModal(false);
      setCreateForm({ name: '', code: '', description: '', hodRef: '' });
      await fetchData();
    } catch (err: any) {
      alert(err.response?.data?.error || err.message || 'Failed to create department');
    } finally {
      setCreating(false);
    }
  };

  const handleOpenEdit = (dept: Department) => {
    setEditingDept(dept);
    const hodId =
      dept.hodRef && typeof dept.hodRef === 'object'
        ? (dept.hodRef as any)._id
        : dept.hodRef || '';
    setEditForm({
      name: dept.name,
      code: dept.code,
      description: dept.description || '',
      hodRef: hodId,
    });
    setEditModal(true);
  };

  const handleUpdate = async () => {
    if (!editingDept) return;
    setUpdating(true);
    try {
      const payload: any = {
        name: editForm.name.trim(),
        code: editForm.code.trim().toUpperCase(),
        description: editForm.description.trim() || undefined,
        hodRef: editForm.hodRef || undefined,
      };
      await updateDepartment(editingDept._id, payload);
      setEditModal(false);
      setEditingDept(null);
      await fetchData();
    } catch (err: any) {
      alert(err.response?.data?.error || err.message || 'Failed to update department');
    } finally {
      setUpdating(false);
    }
  };

  const handleDeactivate = async () => {
    if (!deleteDept) return;
    setDeleting(true);
    try {
      await deleteDepartment(deleteDept._id);
      setDeleteDept(null);
      await fetchData();
    } catch (err: any) {
      alert(err.response?.data?.error || err.message || 'Failed to deactivate department');
    } finally {
      setDeleting(false);
    }
  };

  const filtered = departments.filter((d) => {
    const q = search.toLowerCase();
    const hod = d.hodRef as any;
    const hodName = hod?.name || '';
    return (
      d.name.toLowerCase().includes(q) ||
      d.code.toLowerCase().includes(q) ||
      (d.description || '').toLowerCase().includes(q) ||
      hodName.toLowerCase().includes(q)
    );
  });

  const totalDepts = departments.length;
  const assignedHods = departments.filter((d) => !!d.hodRef).length;
  const unassignedHods = totalDepts - assignedHods;

  if (loading) return <LoadingSpinner text="Loading academic departments..." />;

  return (
    <div className="space-y-6 animate-fadeIn pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Department &amp; School Governance</h1>
          <p className="text-xs font-medium text-slate-500 mt-1">
            Configure academic schools, departmental codes, and appoint Department Heads (HODs)
          </p>
        </div>
        <Button variant="primary" icon={<Plus className="w-4 h-4" />} onClick={() => setCreateModal(true)}>
          Create New Department
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 flex items-center gap-4 bg-white border border-slate-200">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">{totalDepts}</div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Active Departments
            </div>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-4 bg-white border border-slate-200">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">{assignedHods}</div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Designated HODs
            </div>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-4 bg-white border border-slate-200">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">{unassignedHods}</div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Unassigned Leadership
            </div>
          </div>
        </Card>
      </div>

      {/* Search Bar */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
        <div className="max-w-md">
          <SearchBar value={search} onChange={setSearch} placeholder="Search departments by code, name, or HOD..." />
        </div>
      </div>

      {/* Departments Table */}
      <Card className="p-0 overflow-hidden">
        {filtered.length === 0 ? (
          <EmptyState
            title="No departments found"
            description="No departments match your current search query."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-5">Department Info</th>
                  <th className="py-3.5 px-4">Code</th>
                  <th className="py-3.5 px-4">Head of Department (HOD)</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((dept) => {
                  const hod = dept.hodRef as any;
                  return (
                    <tr key={dept._id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 font-bold text-xs flex items-center justify-center shrink-0 border border-blue-100">
                            {dept.code.slice(0, 3)}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 text-sm">{dept.name}</div>
                            {dept.description && (
                              <div className="text-[11px] text-slate-500 max-w-sm truncate mt-0.5">
                                {dept.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200/60 text-xs">
                          {dept.code}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        {hod ? (
                          <div className="flex items-center gap-2">
                            <Avatar name={hod.name} size="sm" />
                            <div>
                              <div className="font-bold text-slate-900">{hod.name}</div>
                              <div className="text-[10px] text-slate-400">{hod.email}</div>
                            </div>
                          </div>
                        ) : (
                          <Badge variant="warning">Unassigned</Badge>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge variant={dept.isActive !== false ? 'success' : 'danger'}>
                          {dept.isActive !== false ? 'Active' : 'Archived'}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <div className="inline-flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={<Edit3 className="w-3.5 h-3.5" />}
                            onClick={() => handleOpenEdit(dept)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-rose-600 hover:bg-rose-50"
                            icon={<Trash2 className="w-3.5 h-3.5" />}
                            onClick={() => setDeleteDept(dept)}
                          >
                            Deactivate
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Create Department Modal */}
      <Modal
        open={createModal}
        onClose={() => setCreateModal(false)}
        title="Create New Academic Department"
        size="md"
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <Button variant="ghost" onClick={() => setCreateModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" loading={creating} onClick={handleCreate}>
              Save Department
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <FormField label="Department Name" required>
                <input
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  value={createForm.name}
                  onChange={(e) => setCreateForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. Artificial Intelligence & Data Science"
                />
              </FormField>
            </div>
            <div>
              <FormField label="Code" required hint="Unique acronym">
                <input
                  className="w-full px-3 py-2 text-xs font-mono uppercase bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  value={createForm.code}
                  onChange={(e) => setCreateForm((p) => ({ ...p, code: e.target.value.toUpperCase() }))}
                  placeholder="AIDS"
                  maxLength={8}
                />
              </FormField>
            </div>
          </div>

          <FormField label="Designated Head of Department (HOD)" hint="Select from faculty and HOD personnel">
            <select
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              value={createForm.hodRef}
              onChange={(e) => setCreateForm((p) => ({ ...p, hodRef: e.target.value }))}
            >
              <option value="">— Leave Unassigned for Now —</option>
              {hodUsers.map((u) => (
                <option key={u._id} value={u._id}>
                  {u.name} ({u.email})
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Department Scope & Description">
            <textarea
              rows={3}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 resize-none"
              value={createForm.description}
              onChange={(e) => setCreateForm((p) => ({ ...p, description: e.target.value }))}
              placeholder="Curricular scope, key labs, and departmental accreditation goals..."
            />
          </FormField>
        </div>
      </Modal>

      {/* Edit Department Modal */}
      <Modal
        open={editModal}
        onClose={() => setEditModal(false)}
        title={`Edit Department: ${editingDept?.name || 'Department'}`}
        size="md"
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <Button variant="ghost" onClick={() => setEditModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" loading={updating} onClick={handleUpdate}>
              Save Changes
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <FormField label="Department Name" required>
                <input
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  value={editForm.name}
                  onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))}
                />
              </FormField>
            </div>
            <div>
              <FormField label="Code" required>
                <input
                  className="w-full px-3 py-2 text-xs font-mono uppercase bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  value={editForm.code}
                  onChange={(e) => setEditForm((p) => ({ ...p, code: e.target.value.toUpperCase() }))}
                  maxLength={8}
                />
              </FormField>
            </div>
          </div>

          <FormField label="Designated Head of Department (HOD)">
            <select
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              value={editForm.hodRef}
              onChange={(e) => setEditForm((p) => ({ ...p, hodRef: e.target.value }))}
            >
              <option value="">— Unassigned —</option>
              {hodUsers.map((u) => (
                <option key={u._id} value={u._id}>
                  {u.name} ({u.email})
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Department Scope & Description">
            <textarea
              rows={3}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 resize-none"
              value={editForm.description}
              onChange={(e) => setEditForm((p) => ({ ...p, description: e.target.value }))}
            />
          </FormField>
        </div>
      </Modal>

      {/* Deactivate Modal */}
      <Modal
        open={!!deleteDept}
        onClose={() => setDeleteDept(null)}
        title="Deactivate Department"
        size="sm"
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <Button variant="ghost" onClick={() => setDeleteDept(null)}>
              Cancel
            </Button>
            <Button variant="danger" loading={deleting} onClick={handleDeactivate}>
              Confirm Deactivation
            </Button>
          </div>
        }
      >
        <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
          <p>
            Are you sure you want to deactivate <strong>{deleteDept?.name}</strong> ({deleteDept?.code})?
          </p>
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
            <span>This will safely soft-archive the department while preserving faculty records and historical credentials.</span>
          </div>
        </div>
      </Modal>
    </div>
  );
};
