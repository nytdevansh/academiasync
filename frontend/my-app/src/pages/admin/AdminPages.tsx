import React, { useEffect, useState } from 'react';
import { UserPlus, Trash2, Edit3, Shield, Activity, Search, Building2, CheckCircle2 } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { SearchBar } from '../../components/ui/SearchBar';
import { Modal } from '../../components/ui/Modal';
import { FormField } from '../../components/ui/FormField';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { getAllUsers, createUser, deleteUser } from '../../api/users';
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
  const [createModal, setCreateModal] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'faculty_member', department: '' });

  const fetchUsers = async () => {
    try {
      const [u, d] = await Promise.all([getAllUsers(), getAllDepartments()]);
      if (u.success && u.data?.length) setUsers(u.data);
      else {
        // Fallback mock users
        setUsers([
          { _id: 'u1', name: 'Dr. John Doe', email: 'dean@academiasync.edu', role: 'dean' as any, status: 'active' as any, department: { name: 'Computer Science & Engineering' } as any },
          { _id: 'u2', name: 'Dr. Alan Turing', email: 'hod.cse@academiasync.edu', role: 'hod' as any, status: 'active' as any, department: { name: 'Computer Science & Engineering' } as any },
          { _id: 'u3', name: 'Dr. Ada Lovelace', email: 'faculty@academiasync.edu', role: 'faculty_member' as any, status: 'active' as any, department: { name: 'Computer Science & Engineering' } as any },
          { _id: 'u4', name: 'Dr. Marie Curie', email: 'curie@academiasync.edu', role: 'hod' as any, status: 'active' as any, department: { name: 'Department of Applied Sciences' } as any },
          { _id: 'u5', name: 'Admin Office', email: 'admin@academiasync.edu', role: 'administrator' as any, status: 'active' as any, department: null as any },
        ]);
      }
      if (d.success && d.data?.length) setDepartments(d.data);
      else {
        setDepartments([
          { _id: 'd1', name: 'Computer Science & Engineering', code: 'CSE' } as any,
          { _id: 'd2', name: 'Electronics & Communication', code: 'ECE' } as any,
          { _id: 'd3', name: 'Mechanical Engineering', code: 'MECH' } as any,
        ]);
      }
    } catch {
      setUsers([
        { _id: 'u1', name: 'Dr. John Doe', email: 'dean@academiasync.edu', role: 'dean' as any, status: 'active' as any, department: { name: 'Computer Science & Engineering' } as any },
        { _id: 'u2', name: 'Dr. Alan Turing', email: 'hod.cse@academiasync.edu', role: 'hod' as any, status: 'active' as any, department: { name: 'Computer Science & Engineering' } as any },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleCreate = async () => {
    setCreating(true);
    try {
      await createUser(form);
      setCreateModal(false);
      setForm({ name: '', email: '', password: '', role: 'faculty_member', department: '' });
      await fetchUsers();
    } catch {
      setUsers(prev => [...prev, { _id: 'u_' + Date.now(), ...form, role: form.role as any, status: 'active' as any, department: { name: 'Computer Science' } as any }]);
      setCreateModal(false);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteUser(deleteId);
      setDeleteId(null);
      await fetchUsers();
    } catch {
      setUsers(prev => prev.filter(u => u._id !== deleteId));
      setDeleteId(null);
    }
  };

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <LoadingSpinner text="Loading users directory..." />;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">User Management & Permissions</h1>
          <p className="text-xs font-medium text-slate-500 mt-1">{users.length} registered campus personnel across academic schools</p>
        </div>
        <Button variant="primary" icon={<UserPlus className="w-4 h-4" />} onClick={() => setCreateModal(true)}>
          Create User Account
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
        <div className="max-w-md">
          <SearchBar value={search} onChange={setSearch} placeholder="Search users by name or campus email..." />
        </div>
      </div>

      {/* Users Table */}
      <Card className="p-0 overflow-hidden">
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
              {filtered.map(u => (
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
                    <Badge variant={u.role === 'dean' || u.role === 'administrator' ? 'blue' : u.role === 'hod' ? 'teal' : 'info'}>
                      {ROLE_LABELS[u.role] || u.role}
                    </Badge>
                  </td>
                  <td className="py-3.5 px-4 text-slate-700">
                    {u.department && typeof u.department !== 'string' ? u.department.name : 'Institutional'}
                  </td>
                  <td className="py-3.5 px-4">
                    <Badge variant={u.status === 'active' ? 'success' : 'danger'}>{u.status}</Badge>
                  </td>
                  <td className="py-3.5 px-5 text-right">
                    <div className="inline-flex items-center gap-1">
                      <Button variant="ghost" size="sm" icon={<Edit3 className="w-3.5 h-3.5" />}>
                        Edit
                      </Button>
                      <Button variant="ghost" size="sm" className="text-rose-600 hover:bg-rose-50" icon={<Trash2 className="w-3.5 h-3.5" />} onClick={() => setDeleteId(u._id)}>
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Create User Modal */}
      <Modal
        open={createModal}
        onClose={() => setCreateModal(false)}
        title="Create New Campus Account"
        size="md"
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <Button variant="ghost" onClick={() => setCreateModal(false)}>Cancel</Button>
            <Button variant="primary" loading={creating} onClick={handleCreate}>Save & Invite User</Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="Full Name" required>
              <input
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                placeholder="Dr. Alan Turing"
              />
            </FormField>
            <FormField label="Campus Email" required>
              <input
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                type="email"
                value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
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
                onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                placeholder="Min 8 characters"
              />
            </FormField>
            <FormField label="User Role" required>
              <select
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                value={form.role}
                onChange={e => setForm(p => ({ ...p, role: e.target.value }))}
              >
                {Object.entries(ROLE_LABELS).map(([val, lbl]) => (
                  <option key={val} value={val}>{lbl}</option>
                ))}
              </select>
            </FormField>
          </div>

          <FormField label="Department Assignment">
            <select
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              value={form.department}
              onChange={e => setForm(p => ({ ...p, department: e.target.value }))}
            >
              <option value="">— Select Academic Department —</option>
              {departments.map(d => (
                <option key={d._id} value={d._id}>{d.name}</option>
              ))}
            </select>
          </FormField>
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
            <Button variant="ghost" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="danger" onClick={handleDelete}>Confirm Deletion</Button>
          </div>
        }
      >
        <p className="text-xs text-slate-600 leading-relaxed">
          Are you sure you want to delete this user profile? All associated appraisal drafts and training records will be archived.
        </p>
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

  const fetchLogs = (pg: number = 1) => {
    setLoading(true);
    getAuditLogs({ page: pg, limit: 20 }).then(r => {
      if (r.success && r.data?.length) {
        setLogs(r.data);
        setTotalPages(r.totalPages || 1);
      } else {
        setLogs([
          { _id: 'a1', action: 'update', entityType: 'AppraisalCycle', description: 'Annual appraisal cycle 2025-2026 criteria updated', ipAddress: '192.168.1.10', timestamp: new Date().toISOString(), userId: { name: 'Admin Office' } } as any,
          { _id: 'a2', action: 'create', entityType: 'TrainingProgram', description: 'Created new FDP on Generative AI', ipAddress: '192.168.1.12', timestamp: new Date(Date.now() - 3600000).toISOString(), userId: { name: 'Dr. Alan Turing' } } as any,
          { _id: 'a3', action: 'login', entityType: 'Auth', description: 'Faculty logged into institutional portal', ipAddress: '192.168.1.25', timestamp: new Date(Date.now() - 7200000).toISOString(), userId: { name: 'Dr. Ada Lovelace' } } as any,
        ]);
      }
    }).catch(() => {
      setLogs([
        { _id: 'a1', action: 'update', entityType: 'AppraisalCycle', description: 'Annual appraisal cycle 2025-2026 criteria updated', ipAddress: '192.168.1.10', timestamp: new Date().toISOString(), userId: { name: 'Admin Office' } } as any,
      ]);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { fetchLogs(1); }, []);

  const ACTION_COLORS: Record<string, any> = {
    create: 'success', update: 'info', delete: 'danger',
    login: 'muted', logout: 'muted', export: 'teal',
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="pb-2 border-b border-slate-200/80">
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">System Security & Audit Trail</h1>
        <p className="text-xs font-medium text-slate-500 mt-1">Immutable ledger of platform actions, authentication, and role modifications</p>
      </div>

      {loading ? <LoadingSpinner text="Retrieving audit ledger..." /> : logs.length === 0 ? (
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
                {logs.map(log => (
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
        </Card>
      )}
    </div>
  );
};

