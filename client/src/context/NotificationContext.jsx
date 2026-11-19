import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { notificationService } from '../services/notificationService';
import { useAuth } from './AuthContext';
import { useSocket } from './SocketContext';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const { subscribe } = useSocket();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async ({ quiet = false } = {}) => {
    if (!isAuthenticated) return;
    if (!quiet) setLoading(true);
    try {
      const data = await notificationService.list({ limit: 30 });
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch {
      // Notifications are non-critical; keep the rest of the app usable.
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) load();
    else {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [isAuthenticated, load]);

  useEffect(() => {
    if (!isAuthenticated) return undefined;
    return subscribe('notification:new', (notification) => {
      setNotifications((current) => [notification, ...current].slice(0, 30));
      setUnreadCount((count) => count + 1);
      toast(notification.message, { icon: '🔔' });
    });
  }, [isAuthenticated, subscribe]);

  const markRead = useCallback(async (id) => {
    try {
      const data = await notificationService.markRead(id);
      setNotifications((current) =>
        current.map((item) => (item._id === id ? { ...item, isRead: true } : item))
      );
      setUnreadCount(data.unreadCount);
    } catch (error) {
      toast.error(error.message);
    }
  }, []);

  const markAllRead = useCallback(async () => {
    try {
      await notificationService.markAllRead();
      setNotifications((current) => current.map((item) => ({ ...item, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      toast.error(error.message);
    }
  }, []);

  const remove = useCallback(async (id) => {
    try {
      const data = await notificationService.remove(id);
      setNotifications((current) => current.filter((item) => item._id !== id));
      setUnreadCount(data.unreadCount);
    } catch (error) {
      toast.error(error.message);
    }
  }, []);

  const value = useMemo(
    () => ({
      notifications,
      unreadCount,
      loading,
      load,
      markRead,
      markAllRead,
      remove,
    }),
    [notifications, unreadCount, loading, load, markRead, markAllRead, remove]
  );

  return (
    <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
