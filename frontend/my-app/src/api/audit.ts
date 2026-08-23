import axiosInstance from './axiosInstance';
import type { ApiResponse, AuditLog } from '../types';

export const getAuditLogs = async (params?: any): Promise<ApiResponse<AuditLog[]>> => {
  const { data } = await axiosInstance.get('/audit', { params });
  return data;
};