import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  getMyNotifications,
  markAllRead,
  markAsRead,
} from '../api/notifications';
import type { Notification } from '../types';

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await getMyNotifications();
      setNotifications(response.data ?? []);
      return response.data ?? [];
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to load notifications';
      setError(message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const readNotification = useCallback(async (id: string) => {
    try {
      await markAsRead(id);
      setNotifications((current) =>
        current.map((item) =>
          item._id === id ? { ...item, status: 'read' } : item
        )
      );
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to mark notification as read';
      setError(message);
      return false;
    }
  }, []);

  const readAll = useCallback(async () => {
    try {
      await markAllRead();
      setNotifications((current) =>
        current.map((item) => ({ ...item, status: 'read' }))
      );
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to mark notifications as read';
      setError(message);
      return false;
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return useMemo(() => ({
    notifications,
    loading,
    error,
    refresh,
    readNotification,
    readAll,
    unreadCount: notifications.filter((item) => item.status !== 'read').length,
  }), [notifications, loading, error, refresh, readNotification, readAll]);
}

export default useNotifications;