import React, { useEffect, useState } from 'react';
import {
  Bell, Check, CheckCheck, Archive, Trash2, Inbox, Clock,
  Award, BookOpen, ClipboardList, RefreshCw, Send, Plus, Megaphone,
  Activity, CheckCircle2, AlertCircle, ShieldCheck
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { FormField } from '../../components/ui/FormField';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { Pagination } from '../../components/ui/Pagination';
import {
  getMyNotifications, markAsRead, markAllRead,
  archiveNotification, deleteNotification, broadcastNotification,
  sendTestEmail, getTestEmailHistory, type DiagnosticLog
} from '../../api/notifications';
import { useAuth } from '../../context/AuthContext';
import type { AppNotification } from '../../types';

type TabType = 'all' | 'unread' | 'archived';

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function notifIcon(type: string) {
  switch (type) {
    case 'training':   return <BookOpen className="w-4 h-4 text-blue-600" />;
    case 'appraisal':  return <ClipboardList className="w-4 h-4 text-indigo-600" />;
    case 'deadline':   return <Clock className="w-4 h-4 text-amber-600" />;
    case 'renewal':    return <Award className="w-4 h-4 text-teal-600" />;
    case 'system':     return <Megaphone className="w-4 h-4 text-rose-600" />;
    default:           return <Bell className="w-4 h-4 text-slate-500" />;
  }
}

function notifColor(type: string): string {
  switch (type) {
    case 'training':   return 'bg-blue-50 border-blue-200';
    case 'appraisal':  return 'bg-indigo-50 border-indigo-200';
    case 'deadline':   return 'bg-amber-50 border-amber-200';
    case 'renewal':    return 'bg-teal-50 border-teal-200';
    case 'system':     return 'bg-rose-50 border-rose-200';
    default:           return 'bg-slate-50 border-slate-200';
  }
}

export const NotificationsPage: React.FC = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabType>('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [markingAll, setMarkingAll] = useState(false);
  const [actionIds, setActionIds] = useState<Set<string>>(new Set());

  // Broadcast Modal State (Admin / Dean only)
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastRole, setBroadcastRole] = useState('all');
  const [broadcastSendEmail, setBroadcastSendEmail] = useState(false);
  const [broadcasting, setBroadcasting] = useState(false);
  const [broadcastStatus, setBroadcastStatus] = useState<string | null>(null);

  // Diagnostics State (Admin only)
  const [showDiagModal, setShowDiagModal] = useState(false);
  const [diagEmail, setDiagEmail] = useState(user?.email || '');
  const [testingEmail, setTestingEmail] = useState(false);
  const [diagResult, setDiagResult] = useState<DiagnosticLog | null>(null);
  const [diagHistory, setDiagHistory] = useState<DiagnosticLog[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const loadDiagHistory = async () => {
    try {
      setLoadingHistory(true);
      const res = await getTestEmailHistory();
      if (res.success && res.data) {
        setDiagHistory(res.data);
      }
    } catch {
      /* ignore */
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleSendTestEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setTestingEmail(true);
    setDiagResult(null);
    try {
      const res = await sendTestEmail(diagEmail);
      if (res.data) {
        setDiagResult(res.data);
        loadDiagHistory();
      }
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Diagnostic test send failed');
    } finally {
      setTestingEmail(false);
    }
  };

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const res = await getMyNotifications({ includeArchived: true });
      if (res.success && res.data) {
        setNotifications(res.data);
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const filtered = notifications.filter(n => {
    if (tab === 'unread')   return n.status === 'unread';
    if (tab === 'archived') return n.status === 'archived';
    return n.status !== 'archived'; // 'all' (inbox) tab excludes archived
  });

  const unreadCount = notifications.filter(n => n.status === 'unread').length;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginatedNotifications = filtered.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    setPage(1);
  }, [tab, pageSize]);

  const handleMarkRead = async (id: string) => {
    setActionIds(prev => new Set(prev).add(id));
    try {
      await markAsRead(id);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, status: 'read' as const } : n));
    } finally {
      setActionIds(prev => { const s = new Set(prev); s.delete(id); return s; });
    }
  };

  const handleArchive = async (id: string) => {
    setActionIds(prev => new Set(prev).add(id));
    try {
      await archiveNotification(id);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, status: 'archived' as const } : n));
    } finally {
      setActionIds(prev => { const s = new Set(prev); s.delete(id); return s; });
    }
  };

  const handleDelete = async (id: string) => {
    setActionIds(prev => new Set(prev).add(id));
    try {
      await deleteNotification(id);
      setNotifications(prev => prev.filter(n => n._id !== id));
    } finally {
      setActionIds(prev => { const s = new Set(prev); s.delete(id); return s; });
    }
  };

  const handleMarkAllRead = async () => {
    setMarkingAll(true);
    try {
      await markAllRead();
      setNotifications(prev => prev.map(n => n.status === 'unread' ? { ...n, status: 'read' as const } : n));
    } finally {
      setMarkingAll(false);
    }
  };

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle || !broadcastMessage) return;
    setBroadcasting(true);
    setBroadcastStatus(null);
    try {
      const res = await broadcastNotification({
        title: broadcastTitle.trim(),
        message: broadcastMessage.trim(),
        targetRole: broadcastRole === 'all' ? undefined : broadcastRole,
        sendEmail: broadcastSendEmail,
      });
      if (res.success) {
        setShowBroadcastModal(false);
        setBroadcastTitle('');
        setBroadcastMessage('');
        setBroadcastSendEmail(false);
        await loadNotifications();
      }
    } catch (err: any) {
      setBroadcastStatus(err.response?.data?.error || 'Failed to dispatch broadcast notice');
    } finally {
      setBroadcasting(false);
    }
  };

  const canBroadcast = ['administrator', 'dean'].includes(user?.role || '');

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Notifications</h1>
          <p className="text-xs font-medium text-slate-500 mt-1">
            All system alerts, training mandates, appraisal updates, and deadline reminders
          </p>
        </div>
        <div className="flex items-center gap-2">
          {canBroadcast && (
            <Button
              variant="primary"
              size="sm"
              icon={<Megaphone className="w-3.5 h-3.5" />}
              onClick={() => setShowBroadcastModal(true)}
            >
              Broadcast Notice
            </Button>
          )}
          {user?.role === 'administrator' && (
            <Button
              variant="outline"
              size="sm"
              icon={<Activity className="w-3.5 h-3.5 text-blue-600" />}
              onClick={() => {
                setShowDiagModal(true);
                loadDiagHistory();
              }}
            >
              Email Diagnostics
            </Button>
          )}
          <Button variant="outline" size="sm" icon={<RefreshCw className="w-3.5 h-3.5" />} onClick={loadNotifications}>
            Refresh
          </Button>
          {unreadCount > 0 && (
            <Button variant="primary" size="sm" loading={markingAll} icon={<CheckCheck className="w-3.5 h-3.5" />} onClick={handleMarkAllRead}>
              Mark All Read
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl w-fit">
        {([
          { key: 'all',      label: 'Inbox',    icon: <Inbox className="w-3.5 h-3.5" /> },
          { key: 'unread',   label: 'Unread',   icon: <Bell className="w-3.5 h-3.5" /> },
          { key: 'archived', label: 'Archived', icon: <Archive className="w-3.5 h-3.5" /> },
        ] as { key: TabType; label: string; icon: React.ReactNode }[]).map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              tab === t.key ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {t.icon}
            {t.label}
            {t.key === 'unread' && unreadCount > 0 && (
              <span className="ml-0.5 px-1.5 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-black">
                {unreadCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <LoadingSpinner text="Loading notifications..." />
      ) : filtered.length === 0 ? (
        <EmptyState
          title={tab === 'unread' ? 'All caught up!' : tab === 'archived' ? 'Nothing archived yet' : 'No notifications'}
          description={
            tab === 'unread'
              ? 'You have no unread notifications right now.'
              : 'Notifications will appear here when there are system alerts, training mandates, or appraisal updates.'
          }
        />
      ) : (
        <div className="space-y-2">
          {paginatedNotifications.map(notif => (
            <Card
              key={notif._id}
              className={`p-4 flex items-start gap-4 transition-all ${notif.status === 'unread' ? 'border-blue-200 bg-blue-50/30' : ''}`}
            >
              {/* Type Icon */}
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center border shrink-0 ${notifColor(notif.type)}`}>
                {notifIcon(notif.type)}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-extrabold text-slate-900">{notif.title}</span>
                  {notif.status === 'unread' && <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />}
                  <Badge variant="muted">{notif.type}</Badge>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{notif.message}</p>
                {notif.dueDate && (
                  <div className="flex items-center gap-1 mt-1.5 text-[10px] font-semibold text-amber-700">
                    <Clock className="w-3 h-3" />
                    Due: {new Date(notif.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>
                )}
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <span className="text-[10px] text-slate-400">{timeAgo(notif.createdAt)}</span>
                  {notif.emailStatus && notif.emailStatus !== 'skipped' && (
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                      notif.emailStatus === 'sent'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}>
                      ✉️ Email {notif.emailStatus}
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1.5 shrink-0">
                {notif.status === 'unread' && (
                  <button
                    disabled={actionIds.has(notif._id)}
                    onClick={() => handleMarkRead(notif._id)}
                    title="Mark as read"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer disabled:opacity-40"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                )}
                {notif.status !== 'archived' ? (
                  <button
                    disabled={actionIds.has(notif._id)}
                    onClick={() => handleArchive(notif._id)}
                    title="Archive"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-40"
                  >
                    <Archive className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    disabled={actionIds.has(notif._id)}
                    onClick={() => handleDelete(notif._id)}
                    title="Delete permanently"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer disabled:opacity-40"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </Card>
          ))}
          <Pagination
            page={page}
            totalPages={totalPages}
            pageSize={pageSize}
            totalItems={filtered.length}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            pageSizeOptions={[10, 20, 50]}
          />
        </div>
      )}

      {/* Broadcast Notice Modal (Admin / Dean) */}
      {showBroadcastModal && (
        <Modal
          open={showBroadcastModal}
          onClose={() => setShowBroadcastModal(false)}
          title="Broadcast Campus Announcement"
          size="md"
        >
          <form onSubmit={handleSendBroadcast} className="space-y-4">
            {broadcastStatus && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
                {broadcastStatus}
              </div>
            )}

            <FormField label="Target Audience" required>
              <select
                value={broadcastRole}
                onChange={e => setBroadcastRole(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              >
                <option value="all">All University Users (Campus Wide)</option>
                <option value="faculty_member">Faculty Members Only</option>
                <option value="hod">Heads of Department (HODs)</option>
                <option value="dean">Deans & Leadership</option>
                <option value="hr">Human Resources (HR)</option>
              </select>
            </FormField>

            <FormField label="Notice Title / Subject" required>
              <input
                type="text"
                required
                value={broadcastTitle}
                onChange={e => setBroadcastTitle(e.target.value)}
                placeholder="e.g. Annual Appraisal Cycle Commencement Notice"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
            </FormField>

            <FormField label="Announcement Message" required>
              <textarea
                rows={4}
                required
                value={broadcastMessage}
                onChange={e => setBroadcastMessage(e.target.value)}
                placeholder="Compose institutional announcement details..."
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
            </FormField>

            <div className="space-y-2">
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-blue-50/50 border border-blue-100">
                <input
                  type="checkbox"
                  id="broadcastSendEmail"
                  checked={broadcastSendEmail}
                  onChange={e => setBroadcastSendEmail(e.target.checked)}
                  className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
                />
                <label htmlFor="broadcastSendEmail" className="text-xs font-semibold text-slate-700 cursor-pointer select-none">
                  Also send this announcement as an official email to all recipients
                </label>
              </div>
              {broadcastSendEmail && (
                <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-800 leading-relaxed">
                  <strong>Quota Advisory:</strong> Standard personal Gmail API accounts have a ~500 recipients/day ceiling. For institution-wide broadcasts with larger faculties, ensure Google Workspace (2,000/day) or a transactional provider (Resend/SendGrid) is configured.
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
              <Button type="button" variant="ghost" onClick={() => setShowBroadcastModal(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" loading={broadcasting} icon={<Send className="w-3.5 h-3.5" />}>
                Send Announcement
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Email Diagnostics Modal (Administrator Only) */}
      {showDiagModal && (
        <Modal
          open={showDiagModal}
          onClose={() => setShowDiagModal(false)}
          title="Email Transport Diagnostics & Verification"
          size="lg"
        >
          <div className="space-y-6">
            <p className="text-xs text-slate-500">
              Trigger a real-time email dispatch to verify outbound OAuth2 Gmail API transport, token validity, and inspect recent delivery audit logs.
            </p>

            {/* Test Send Form */}
            <form onSubmit={handleSendTestEmail} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Dispatch Test Email</h3>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="email"
                  required
                  value={diagEmail}
                  onChange={e => setDiagEmail(e.target.value)}
                  placeholder="admin@university.edu"
                  className="flex-1 px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  loading={testingEmail}
                  icon={<Send className="w-3.5 h-3.5" />}
                >
                  Send Test Email
                </Button>
              </div>
            </form>

            {/* Test Result Display */}
            {diagResult && (
              <div className={`p-4 rounded-xl border ${diagResult.success ? 'bg-emerald-50/70 border-emerald-200' : 'bg-rose-50/70 border-rose-200'} space-y-2`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {diagResult.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-600" />
                    )}
                    <span className="text-xs font-bold text-slate-900">
                      {diagResult.success ? 'Diagnostic Dispatch Succeeded' : 'Diagnostic Dispatch Failed'}
                    </span>
                  </div>
                  <Badge variant={diagResult.isLiveDelivery ? 'success' : 'warning'}>
                    {diagResult.mode}
                  </Badge>
                </div>

                {diagResult.messageId && (
                  <p className="text-[11px] font-mono text-slate-600 break-all">
                    Message ID: {diagResult.messageId}
                  </p>
                )}

                {diagResult.warning && (
                  <p className="text-[11px] text-amber-800 bg-amber-100/50 p-2 rounded border border-amber-200">
                    {diagResult.warning}
                  </p>
                )}

                {diagResult.error && (
                  <p className="text-[11px] text-rose-800 bg-rose-100/50 p-2 rounded border border-rose-200 font-mono">
                    {diagResult.error}
                  </p>
                )}
              </div>
            )}

            {/* Diagnostics History */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-blue-600" /> Recent Diagnostic Dispatches ({diagHistory.length})
                </h3>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  loading={loadingHistory}
                  icon={<RefreshCw className="w-3 h-3" />}
                  onClick={loadDiagHistory}
                >
                  Refresh
                </Button>
              </div>

              {loadingHistory && diagHistory.length === 0 ? (
                <div className="py-6 flex justify-center">
                  <LoadingSpinner size="sm" />
                </div>
              ) : diagHistory.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-slate-200">
                  No diagnostic emails dispatched yet in this session.
                </div>
              ) : (
                <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                  {diagHistory.map((entry) => (
                    <div
                      key={entry.id}
                      className="p-2.5 rounded-lg border border-slate-200 bg-white hover:border-slate-300 transition-colors flex items-center justify-between text-xs gap-2"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <Badge variant={entry.success ? 'success' : 'danger'}>
                            {entry.success ? 'Delivered' : 'Failed'}
                          </Badge>
                          <span className="font-semibold text-slate-800 truncate">{entry.recipient}</span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })} • Mode: {entry.mode}
                        </p>
                      </div>
                      {entry.messageId && (
                        <span className="text-[10px] font-mono text-slate-500 max-w-[120px] truncate" title={entry.messageId}>
                          {entry.messageId}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-200">
              <Button type="button" variant="outline" onClick={() => setShowDiagModal(false)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
