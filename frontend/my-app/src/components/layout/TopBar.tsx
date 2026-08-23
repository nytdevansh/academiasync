import React, { useState, useEffect, useRef } from 'react';
import { Bell, X, Check, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { getMyNotifications, markAllRead, markAsRead } from '../../api/notifications';
import type { Notification } from '../../types';

interface TopBarProps { title: string; }

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export const TopBar: React.FC<TopBarProps> = ({ title }) => {
  const { user } = useAuth();
  const [showNotif, setShowNotif] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    const fetchNotifs = async () => {
      try {
        const res = await getMyNotifications();
        if (res.success && res.data) {
          setNotifications(res.data.slice(0, 6));
          setUnread(res.data.filter(n => n.status === 'unread').length);
        }
      } catch { /* ignore */ }
    };
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 60000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setShowNotif(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleMarkAllRead = async () => {
    await markAllRead();
    setNotifications(prev => prev.map(n => ({ ...n, status: 'read' as const })));
    setUnread(0);
  };

  const handleNotifClick = async (notif: Notification) => {
    if (notif.status === 'unread') {
      await markAsRead(notif._id);
      setNotifications(prev => prev.map(n => n._id === notif._id ? { ...n, status: 'read' as const } : n));
      setUnread(prev => Math.max(0, prev - 1));
    }
  };

  if (!user) return null;

  return (
    <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-20 flex items-center justify-between px-6 shadow-2xs">
      <div className="flex items-center gap-3">
        <h1 className="text-lg font-bold text-slate-900 tracking-tight">{title}</h1>
      </div>

      <div className="flex items-center gap-3.5">
        {/* Campus Website shortcut */}
        <Link
          to="/"
          className="hidden md:flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 px-3 py-1.5 rounded-lg hover:bg-slate-50 border border-slate-200 transition-colors"
        >
          <span>Campus Site</span>
          <ExternalLink className="w-3 h-3" />
        </Link>

        {/* Notifications */}
        <div className="relative" ref={ref}>
          <button
            className="relative p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            onClick={() => setShowNotif(!showNotif)}
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unread > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-white" />
            )}
          </button>

          {showNotif && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl border border-slate-200 shadow-xl z-50 overflow-hidden animate-fadeIn">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-sm text-slate-900">Notifications</h4>
                  {unread > 0 && <Badge variant="info">{unread} new</Badge>}
                </div>
                <div className="flex items-center gap-2">
                  {unread > 0 && (
                    <button
                      className="text-xs font-semibold text-blue-600 hover:text-blue-700 cursor-pointer"
                      onClick={handleMarkAllRead}
                    >
                      Mark all read
                    </button>
                  )}
                  <button
                    className="p-1 rounded text-slate-400 hover:text-slate-700 cursor-pointer"
                    onClick={() => setShowNotif(false)}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-500">
                    No notifications yet
                  </div>
                ) : (
                  notifications.map(n => (
                    <div
                      key={n._id}
                      className={`p-3.5 hover:bg-slate-50/80 transition-colors cursor-pointer flex gap-3 ${
                        n.status === 'unread' ? 'bg-blue-50/40' : ''
                      }`}
                      onClick={() => handleNotifClick(n)}
                    >
                      {n.status === 'unread' && (
                        <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0 mt-1.5" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-slate-900 truncate">{n.title}</div>
                        <div className="text-xs text-slate-600 mt-0.5 leading-relaxed">{n.message}</div>
                        <div className="text-[10px] text-slate-400 mt-1.5">{timeAgo(n.createdAt)}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User preview */}
        <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200">
          <Avatar name={user.name} size="sm" />
          <span className="text-sm font-semibold text-slate-800 hidden sm:inline">{user.name.split(' ')[0]}</span>
        </div>
      </div>
    </header>
  );
};