import React, { useEffect, useState } from 'react';
import {
  Bell, Check, CheckCheck, Archive, Trash2, Inbox, Clock,
  Award, BookOpen, ClipboardList, RefreshCw, Send, Plus, Megaphone
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { FormField } from '../../components/ui/FormField';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { EmptyState } from '../../components/ui/EmptyState';
import {
  getMyNotifications, markAsRead, markAllRead,
  archiveNotification, deleteNotification, broadcastNotification
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
          {filtered.map(notif => (
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
                <div className="text-[10px] text-slate-400 mt-1">{timeAgo(notif.createdAt)}</div>
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
    </div>
  );
};
