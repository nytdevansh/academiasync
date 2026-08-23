import axiosInstance from './axiosInstance';
import type { ApiResponse, Notification } from '../types';

export const getMyNotifications = async (): Promise<ApiResponse<Notification[]>> => {
  const { data } = await axiosInstance.get('/notifications/mine');
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