import axiosInstance from './axiosInstance';
import type { ApiResponse, Notification } from '../types';


export const getMyNotifications = async (params?: { includeArchived?: boolean; status?: string }): Promise<ApiResponse<Notification[]>> => {
  const { data } = await axiosInstance.get('/notifications/mine', { params });
  return data;
};

export const markAsRead = async (id: string): Promise<ApiResponse<any>> => {
  const { data } = await axiosInstance.put(`/notifications/${id}/read`);
  return data;
};

export const markAllRead = async (): Promise<ApiResponse<any>> => {
  const { data } = await axiosInstance.put('/notifications/mark-all-read');
  return data;
};

export const archiveNotification = async (id: string): Promise<ApiResponse<any>> => {
  const { data } = await axiosInstance.put(`/notifications/${id}/archive`);
  return data;
};

export const deleteNotification = async (id: string): Promise<ApiResponse<any>> => {
  const { data } = await axiosInstance.delete(`/notifications/${id}`);
  return data;
};

export const broadcastNotification = async (payload: {
  title: string;
  message: string;
  targetRole?: string;
  departmentId?: string;
  sendEmail?: boolean;
}): Promise<ApiResponse<any>> => {
  const { data } = await axiosInstance.post('/notifications/broadcast', payload);
  return data;
};

export interface DiagnosticLog {
  id: string;
  timestamp: string;
  recipient: string;
  mode: string;
  isLiveDelivery: boolean;
  success: boolean;
  messageId: string | null;
  previewUrl: string | null;
  error: string | null;
  warning: string | null;
}

export const sendTestEmail = async (email?: string): Promise<ApiResponse<DiagnosticLog>> => {
  const { data } = await axiosInstance.post('/notifications/test-email', { email });
  return data;
};

export const getTestEmailHistory = async (): Promise<ApiResponse<DiagnosticLog[]>> => {
  const { data } = await axiosInstance.get('/notifications/test-email-history');
  return data;
};