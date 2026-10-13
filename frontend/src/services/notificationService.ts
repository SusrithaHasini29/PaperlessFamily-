import api from './api';
import { Notification, ApiResponse } from '../types';

// ==========================================
// Local Notification Storage
// ==========================================
const getUserNotifKey = (): string => {
  try {
    const u = localStorage.getItem('paperless_user');
    if (u) {
      const parsed = JSON.parse(u);
      if (parsed.email) return `paperless_notifs_${parsed.email.trim().toLowerCase()}`;
    }
  } catch {}
  return 'paperless_notifs_default';
};

const getStoredNotifications = (): Notification[] => {
  try {
    const key = getUserNotifKey();
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  return [];
};

const saveNotifications = (notifs: Notification[]) => {
  try {
    localStorage.setItem(getUserNotifKey(), JSON.stringify(notifs));
  } catch {}
};

const buildDefaultNotifications = (): Notification[] => {
  const now = new Date();
  return [
    {
      id: 1,
      title: 'Welcome to PaperlessFamily!',
      message: 'Start by uploading your first document or inviting a family member.',
      type: 'SYSTEM',
      read: false,
      createdAt: new Date(now.getTime() - 60000 * 5).toISOString(),
    },
  ];
};

export const getNotifications = async (): Promise<ApiResponse<Notification[]>> => {
  try {
    const response = await api.get<ApiResponse<Notification[]>>('/notifications');
    if (response.data && Array.isArray(response.data.data)) {
      return response.data;
    }
  } catch {}

  // Offline fallback
  let notifs = getStoredNotifications();
  if (notifs.length === 0) {
    notifs = buildDefaultNotifications();
    saveNotifications(notifs);
  }
  return { success: true, message: 'Notifications', data: notifs };
};

export const getUnreadCount = async (): Promise<ApiResponse<{ count: number }>> => {
  try {
    const response = await api.get<ApiResponse<{ count: number }>>('/notifications/unread-count');
    if (response.data && response.data.data !== undefined) {
      return response.data;
    }
  } catch {}

  // Offline fallback: count locally
  const notifs = getStoredNotifications();
  const count = notifs.filter(n => !n.read).length;
  return { success: true, message: 'Unread count', data: { count } };
};

export const markAsRead = async (id: number): Promise<ApiResponse<Notification>> => {
  try {
    const response = await api.put<ApiResponse<Notification>>(`/notifications/${id}/read`);
    if (response.data && response.data.data) return response.data;
  } catch {}

  // Offline fallback
  const notifs = getStoredNotifications();
  const idx = notifs.findIndex(n => n.id === id);
  if (idx !== -1) {
    notifs[idx] = { ...notifs[idx], read: true };
    saveNotifications(notifs);
    return { success: true, message: 'Marked as read', data: notifs[idx] };
  }
  return { success: true, message: 'Not found', data: undefined as any };
};

export const markAllAsRead = async (): Promise<ApiResponse<void>> => {
  try {
    const response = await api.put<ApiResponse<void>>('/notifications/read-all');
    if (response.data) return response.data;
  } catch {}

  // Offline fallback
  const notifs = getStoredNotifications().map(n => ({ ...n, read: true }));
  saveNotifications(notifs);
  return { success: true, message: 'All marked as read', data: undefined };
};

export const addNotification = (title: string, message: string, type: string = 'SYSTEM'): void => {
  try {
    const notifs = getStoredNotifications();
    const newNotif: Notification = {
      id: Date.now(),
      title,
      message,
      type,
      read: false,
      createdAt: new Date().toISOString(),
    };
    saveNotifications([newNotif, ...notifs]);
  } catch {}
};

export default {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  addNotification,
};
