import axiosInstance from './axiosInstance';
import type { ApiResponse } from '../types';

export interface Notice {
  _id: string;
  title: string;
  category: 'FACULTY' | 'APPRAISAL' | 'RESEARCH' | 'ACADEMIC' | 'QUALITY' | 'STUDENT' | 'GENERAL';
  author: string;
  content?: string;
  isNew: boolean;
  createdAt: string;
}

export const getPublicNotices = async (): Promise<ApiResponse<Notice[]>> => {
  const { data } = await axiosInstance.get('/notices/public');
  return data;
};

export const getAllNotices = async (): Promise<ApiResponse<Notice[]>> => {
  const { data } = await axiosInstance.get('/notices');
  return data;
};

export const createNotice = async (notice: Partial<Notice>): Promise<ApiResponse<Notice>> => {
  const { data } = await axiosInstance.post('/notices', notice);
  return data;
};

export const updateNotice = async (id: string, updates: Partial<Notice>): Promise<ApiResponse<Notice>> => {
  const { data } = await axiosInstance.put(`/notices/${id}`, updates);
  return data;
};

export const deleteNotice = async (id: string): Promise<ApiResponse<{ message: string }>> => {
  const { data } = await axiosInstance.delete(`/notices/${id}`);
  return data;
};
