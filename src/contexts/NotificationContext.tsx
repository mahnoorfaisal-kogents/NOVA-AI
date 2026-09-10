import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { Notification } from '@/types';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthContext';

interface NotificationContextValue {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
  addNotification: (type: string, title: string, message: string, metadata?: Record<string, unknown>) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) {
      setNotifications([]);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);
    if (!error && data) {
      setNotifications(data as Notification[]);
    }
    setLoading(false);
  }, [user]);

  const markAsRead = useCallback(async (id: string) => {
    await supabase.from('notifications').update({ read: true }).eq('id', id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }, []);

  const markAllAsRead = useCallback(async () => {
    if (!user) return;
    await supabase.from('notifications').update({ read: true }).eq('user_id', user.id).eq('read', false);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, [user]);

  const deleteNotification = useCallback(async (id: string) => {
    await supabase.from('notifications').delete().eq('id', id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const addNotification = useCallback(async (
    type: string,
    title: string,
    message: string,
    metadata?: Record<string, unknown>
  ) => {
    if (!user) return;
    const { data } = await supabase
      .from('notifications')
      .insert({ user_id: user.id, type, title, message, metadata: metadata ?? {} })
      .select('*')
      .maybeSingle();
    if (data) {
      setNotifications((prev) => [data as Notification, ...prev]);
    }
  }, [user]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      loading,
      markAsRead,
      markAllAsRead,
      deleteNotification,
      refresh,
      addNotification,
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
}
