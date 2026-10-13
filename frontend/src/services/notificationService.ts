import api from './api';
import { Notification, ApiResponse } from '../types';

export const getNotifications = async (): Promise<ApiResponse<Notification[]>> => {
  const response = await api.get<ApiResponse<Notification[]>>('/notifications');
  return response.data;
};

export const getUnreadCount = async (): Promise<ApiResponse<{ count: number }>> => {
  const response = await api.get<ApiResponse<{ count: number }>>('/notifications/unread-count');
  return response.data;
};

export const markAsRead = async (id: number): Promise<ApiResponse<Notification>> => {
  const response = await api.put<ApiResponse<Notification>>(`/notifications/${id}/read`);
  return response.data;
};

export const markAllAsRead = async (): Promise<ApiResponse<void>> => {
  const response = await api.put<ApiResponse<void>>('/notifications/read-all');
  return response.data;
};

export default {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
};
