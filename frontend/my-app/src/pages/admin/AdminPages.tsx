import React, { useEffect, useState } from 'react';
import {
  UserPlus,
  Trash2,
  Edit3,
  KeyRound,
  Shield,
  Activity,
  Search,
  Building2,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  Filter,
  Sparkles,
  ShieldOff,
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
import { Pagination } from '../../components/ui/Pagination';
import { getAllUsers, createUser, updateUser, deleteUser, resetUserPassword, revokeUserSessions } from '../../api/users';
import { getAllDepartments } from '../../api/departments';
import { getAuditLogs } from '../../api/audit';
import type { User, Department, AuditLog } from '../../types';
import { ROLE_LABELS, ROLE_COLORS } from '../../utils/constants';

// ── User Management ──────────────────────────────────────────────────────────
export const UserManagementPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Create User Modal State
  const [createModal, setCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'faculty_member', department: '' });

  // Edit User Modal State
  const [editModal, setEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({ name: '', email: '', role: 'faculty_member', department: '', status: 'active' });
  const [updating, setUpdating] = useState(false);

  // Reset Password Modal State
  const [resetModal, setResetModal] = useState(false);
  const [resetUser, setResetUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccessPass, setResetSuccessPass] = useState<string | null>(null);
  const [copiedPass, setCopiedPass] = useState(false);

  // Delete State
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Session Revocation State
  const [revokeUser, setRevokeUser] = useState<User | null>(null);
  const [revoking, setRevoking] = useState(false);
  const [revokeFeedback, setRevokeFeedback] = useState<string | null>(null);

  const handleRevokeSessions = async () => {
    if (!revokeUser) return;
    setRevoking(true);
    try {
      const res = await revokeUserSessions(revokeUser._id);
      setRevokeFeedback(`Terminated all active sessions for ${revokeUser.name} (${res.data?.revokedCount ?? 1} session tokens invalidated).`);
      setTimeout(() => {
        setRevokeFeedback(null);
        setRevokeUser(null);
      }, 2000);
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Failed to terminate user sessions');
      setRevokeUser(null);
    } finally {
      setRevoking(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const [u, d] = await Promise.all([getAllUsers(), getAllDepartments()]);
      if (u.success && u.data?.length) setUsers(u.data);
      if (d.success && d.data?.length) setDepartments(d.data);
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreate = async () => {
    setCreating(true);
    try {
      await createUser(form);
      setCreateModal(false);
      setForm({ name: '', email: '', password: '', role: 'faculty_member', department: '' });
      await fetchUsers();
    } catch (err: any) {
      alert(err.response?.data?.error || err.message || 'Failed to create user');
    } finally {
      setCreating(false);
    }
  };

  const handleOpenEdit = (u: User) => {
    setEditingUser(u);
    const deptId = u.department && typeof u.department === 'object' ? (u.department as any)._id : u.department || '';
    setEditForm({
      name: u.name,
      email: u.email,
      role: u.role,
      department: deptId,
      status: u.status,
    });
    setEditModal(true);
  };

  const handleUpdate = async () => {
    if (!editingUser) return;
    setUpdating(true);
    try {
      await updateUser(editingUser._id, editForm);
      setEditModal(false);
      setEditingUser(null);
      await fetchUsers();
    } catch (err: any) {
      alert(err.response?.data?.error || err.message || 'Failed to update user profile');
    } finally {
      setUpdating(false);
    }
  };

  const handleOpenReset = (u: User) => {
    setResetUser(u);
    const rand = Math.floor(1000 + Math.random() * 9000);
    setNewPassword(`Sync#${rand}@2026`);
    setResetSuccessPass(null);
    setCopiedPass(false);
    setResetModal(true);
  };

  const handleResetPassword = async () => {
    if (!resetUser || !newPassword.trim()) return;
    setResetLoading(true);
    try {
      await resetUserPassword(resetUser._id, newPassword.trim());
      setResetSuccessPass(newPassword.trim());
    } catch (err: any) {
      alert(err.response?.data?.error || err.message || 'Failed to reset password');
    } finally {
      setResetLoading(false);
    }
  };

  const handleCopyPassword = async () => {
    if (!resetSuccessPass) return;
    try {
      await navigator.clipboard.writeText(resetSuccessPass);
      setCopiedPass(true);
      setTimeout(() => setCopiedPass(false), 2500);
    } catch {
      // Fallback
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await deleteUser(deleteId);
      setDeleteId(null);
      await fetchUsers();
    } catch (err: any) {
      alert(err.response?.data?.error || err.message || 'Failed to delete user');
    } finally {
      setDeleting(false);
    }
  };

  const filtered = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = !roleFilter || u.role === roleFilter;
    const userDeptId = u.department && typeof u.department === 'object' ? (u.department as any)._id : u.department;
    const matchesDept = !deptFilter || userDeptId === deptFilter;
    return matchesSearch && matchesRole && matchesDept;
  });
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginatedUsers = filtered.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    setPage(1);
  }, [search, roleFilter, deptFilter, pageSize]);

  if (loading) return <LoadingSpinner text="Loading users directory..." />;

  return (
    <div className="space-y-6 animate-fadeIn pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">User Management &amp; Permissions</h1>
          <p className="text-xs font-medium text-slate-500 mt-1">
            {users.length} registered campus personnel across academic schools and administration
          </p>
        </div>
        <Button variant="primary" icon={<UserPlus className="w-4 h-4" />} onClick={() => setCreateModal(true)}>
          Create User Account
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="w-full md:w-80">
          <SearchBar value={search} onChange={setSearch} placeholder="Search users by name or campus email..." />
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <select
            className="w-full md:w-auto px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="">All User Roles</option>
            {Object.entries(ROLE_LABELS).map(([val, lbl]) => (
              <option key={val} value={val}>
                {lbl}
              </option>
            ))}
          </select>

          <select
            className="w-full md:w-auto px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d._id} value={d._id}>
                {d.name} ({d.code})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Users Table */}
      <Card className="p-0 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            No users match the current search query and filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-5">User Profile</th>
                  <th className="py-3.5 px-4">Role</th>
                  <th className="py-3.5 px-4">Department</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedUsers.map((u) => (
                  <tr key={u._id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-3">
                        <Avatar name={u.name} size="sm" />
                        <div>
                          <div className="font-bold text-slate-900">{u.name}</div>
                          <div className="text-[11px] text-slate-400">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge
                        variant={
                          u.role === 'dean' || u.role === 'administrator'
                            ? 'blue'
                            : u.role === 'hod'
                            ? 'teal'
                            : 'info'
                        }
                      >
                        {ROLE_LABELS[u.role] || u.role}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700">
                      {u.department && typeof u.department !== 'string' ? u.department.name : 'Institutional'}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant={u.status === 'active' ? 'success' : 'danger'}>
                        {u.status === 'active' ? 'Active' : 'Suspended'}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <div className="inline-flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<Edit3 className="w-3.5 h-3.5" />}
                          onClick={() => handleOpenEdit(u)}
                          title="Edit user details"
                        >
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<KeyRound className="w-3.5 h-3.5 text-amber-600" />}
                          onClick={() => handleOpenReset(u)}
                          title="Reset temporary password"
                        >
                          Reset Pass
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<ShieldOff className="w-3.5 h-3.5 text-orange-600" />}
                          onClick={() => setRevokeUser(u)}
                          title="Force logout all active sessions for this user"
                        >
                          Revoke Sessions
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-rose-600 hover:bg-rose-50"
                          icon={<Trash2 className="w-3.5 h-3.5" />}
                          onClick={() => setDeleteId(u._id)}
                          title="Delete account"
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      <Pagination
        page={page}
        totalPages={totalPages}
        pageSize={pageSize}
        totalItems={filtered.length}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        pageSizeOptions={[10, 20, 50]}
      />

      {/* Create User Modal */}
      <Modal
        open={createModal}
        onClose={() => setCreateModal(false)}
        title="Create New Campus Account"
        size="md"
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <Button variant="ghost" onClick={() => setCreateModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" loading={creating} onClick={handleCreate}>
              Save &amp; Invite User
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="Full Name" required>
              <input
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="Dr. Alan Turing"
              />
            </FormField>
            <FormField label="Campus Email" required>
              <input
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                type="email"
                value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                placeholder="turing@academiasync.edu"
              />
            </FormField>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="Initial Password" required>
              <input
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                type="password"
                value={form.password}
                onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                placeholder="Min 8 characters"
              />
            </FormField>
            <FormField label="User Role" required>
              <select
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                value={form.role}
                onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}
              >
                {Object.entries(ROLE_LABELS).map(([val, lbl]) => (
                  <option key={val} value={val}>
                    {lbl}
                  </option>
                ))}
              </select>
            </FormField>
          </div>

          <FormField label="Department Assignment">
            <select
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              value={form.department}
              onChange={(e) => setForm((p) => ({ ...p, department: e.target.value }))}
            >
              <option value="">— Select Academic Department —</option>
              {departments.map((d) => (
                <option key={d._id} value={d._id}>
                  {d.name} ({d.code})
                </option>
              ))}
            </select>
          </FormField>
        </div>
      </Modal>

      {/* Edit User Modal */}
      <Modal
        open={editModal}
        onClose={() => setEditModal(false)}
        title={`Edit Account: ${editingUser?.name || 'User Profile'}`}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="Full Name" required>
              <input
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                value={editForm.name}
                onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))}
              />
            </FormField>
            <FormField label="Campus Email" required>
              <input
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm((p) => ({ ...p, email: e.target.value }))}
              />
            </FormField>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="User Role" required>
              <select
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                value={editForm.role}
                onChange={(e) => setEditForm((p) => ({ ...p, role: e.target.value }))}
              >
                {Object.entries(ROLE_LABELS).map(([val, lbl]) => (
                  <option key={val} value={val}>
                    {lbl}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Account Status" required>
              <select
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                value={editForm.status}
                onChange={(e) => setEditForm((p) => ({ ...p, status: e.target.value }))}
              >
                <option value="active">Active (Access Allowed)</option>
                <option value="inactive">Suspended (Access Blocked)</option>
              </select>
            </FormField>
          </div>

          <FormField label="Department Assignment">
            <select
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              value={editForm.department}
              onChange={(e) => setEditForm((p) => ({ ...p, department: e.target.value }))}
            >
              <option value="">— Institutional / None —</option>
              {departments.map((d) => (
                <option key={d._id} value={d._id}>
                  {d.name} ({d.code})
                </option>
              ))}
            </select>
          </FormField>
        </div>
      </Modal>

      {/* Admin Reset Password Modal */}
      <Modal
        open={resetModal}
        onClose={() => setResetModal(false)}
        title={`Reset Password: ${resetUser?.name || 'User'}`}
        size="sm"
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <Button variant="ghost" onClick={() => setResetModal(false)}>
              {resetSuccessPass ? 'Done' : 'Cancel'}
            </Button>
            {!resetSuccessPass && (
              <Button variant="primary" loading={resetLoading} onClick={handleResetPassword}>
                Confirm Password Reset
              </Button>
            )}
          </div>
        }
      >
        <div className="space-y-4 text-xs">
          {resetSuccessPass ? (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-3">
              <div className="flex items-center gap-2 text-emerald-900 font-bold">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>Password Reset Successfully!</span>
              </div>
              <p className="text-slate-600">
                Provide this temporary password to <strong>{resetUser?.name}</strong>. They will be prompted to log in:
              </p>
              <div className="p-3 bg-white border border-emerald-300 rounded-lg flex items-center justify-between font-mono font-bold text-slate-900 text-sm">
                <span>{resetSuccessPass}</span>
                <Button variant="ghost" size="sm" onClick={handleCopyPassword} className="h-7 text-xs">
                  {copiedPass ? <Check className="w-3.5 h-3.5 text-emerald-600 mr-1" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
                  {copiedPass ? 'Copied' : 'Copy'}
                </Button>
              </div>
            </div>
          ) : (
            <>
              <p className="text-slate-600">
                You are resetting the credentials for <strong>{resetUser?.name}</strong> ({resetUser?.email}).
              </p>

              <FormField label="Temporary Password" required hint="Min 8 chars (auto-generated or custom)">
                <input
                  type="text"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono font-bold bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </FormField>

              <Button
                type="button"
                variant="outline"
                size="sm"
                fullWidth
                icon={<Sparkles className="w-3.5 h-3.5 text-blue-600" />}
                onClick={() => {
                  const rand = Math.floor(1000 + Math.random() * 9000);
                  setNewPassword(`Sync#${rand}@2026`);
                }}
              >
                Generate Another Password
              </Button>
            </>
          )}
        </div>
      </Modal>

      {/* Delete confirmation modal */}
      <Modal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        title="Delete User Account"
        size="sm"
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <Button variant="ghost" onClick={() => setDeleteId(null)}>
              Cancel
            </Button>
            <Button variant="danger" loading={deleting} onClick={handleDelete}>
              Confirm Deletion
            </Button>
          </div>
        }
      >
        <p className="text-xs text-slate-600 leading-relaxed">
          Are you sure you want to delete this user profile? All associated records will be permanently archived.
        </p>
      </Modal>

      {/* Session Revocation Modal */}
      <Modal
        open={!!revokeUser}
        onClose={() => !revoking && setRevokeUser(null)}
        title={`Terminate Active Sessions: ${revokeUser?.name || 'User'}`}
        size="sm"
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <Button variant="ghost" disabled={revoking} onClick={() => setRevokeUser(null)}>
              Cancel
            </Button>
            <Button variant="danger" loading={revoking} onClick={handleRevokeSessions}>
              Revoke All Sessions
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          {revokeFeedback ? (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-700 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> {revokeFeedback}
            </div>
          ) : (
            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to terminate all active sessions for <strong>{revokeUser?.name}</strong> ({revokeUser?.email})? All active refresh tokens across their devices will be immediately invalidated, forcing re-authentication on their next request.
            </p>
          )}
        </div>
      </Modal>
    </div>
  );
};

// ── Audit Log Page ────────────────────────────────────────────────────────────
export const AuditLogPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);
  const [filterAction, setFilterAction] = useState<string>('all');

  const fetchLogs = (pg: number = 1) => {
    setLoading(true);
    setPage(pg);
    getAuditLogs({ page: pg, limit: 20 })
      .then((r) => {
        if (r.success && r.data?.length) {
          setLogs(r.data);
          setTotalPages(r.totalPages || 1);
          setTotalLogs(r.total || r.data.length);
        } else {
          setLogs([]);
        }
      })
      .catch(() => {
        setLogs([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchLogs(1);
  }, []);

  const ACTION_COLORS: Record<string, any> = {
    create: 'success',
    update: 'info',
    delete: 'danger',
    login: 'muted',
    logout: 'muted',
    export: 'teal',
  };

  const filteredLogs = logs.filter((log) => {
    if (filterAction === 'all') return true;
    return log.action.toLowerCase() === filterAction.toLowerCase();
  });

  return (
    <div className="space-y-6 animate-fadeIn pb-16">
      <div className="pb-2 border-b border-slate-200/80">
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">System Security &amp; Audit Trail</h1>
        <p className="text-xs font-medium text-slate-500 mt-1">
          Immutable ledger of platform actions, authentication, and role modifications across the institution
        </p>
      </div>

      {/* Action Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {['all', 'create', 'update', 'delete', 'login', 'logout'].map((act) => (
          <button
            key={act}
            onClick={() => setFilterAction(act)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${
              filterAction === act
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {act}
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingSpinner text="Retrieving audit ledger..." />
      ) : filteredLogs.length === 0 ? (
        <EmptyState title="No audit events logged" description="System audit records will appear here as actions occur" />
      ) : (
        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-5">Actor</th>
                  <th className="py-3.5 px-4">Action</th>
                  <th className="py-3.5 px-4">Entity</th>
                  <th className="py-3.5 px-4">Description</th>
                  <th className="py-3.5 px-4">Client IP</th>
                  <th className="py-3.5 px-5">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-5 font-semibold text-slate-900">
                      {(log.userId as any)?.name || 'System / Automated'}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant={ACTION_COLORS[log.action] || 'muted'}>{log.action}</Badge>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[11px]">
                        {log.entityType}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 max-w-xs truncate text-slate-700">{log.description}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-400 text-[11px]">{log.ipAddress || '—'}</td>
                    <td className="py-3.5 px-5 text-slate-400 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls Footer */}
          <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <div>
              Showing page <strong className="text-slate-900 font-bold">{page}</strong> of{' '}
              <strong className="text-slate-900 font-bold">{totalPages}</strong>
              {totalLogs > 0 && ` (${totalLogs} total events recorded)`}
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => fetchLogs(page - 1)}
                icon={<ChevronLeft className="w-3.5 h-3.5 mr-1" />}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => fetchLogs(page + 1)}
                icon={<ChevronRight className="w-3.5 h-3.5 ml-1" />}
              >
                Next
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
