import axiosInstance from './axiosInstance';
import type { ApiResponse, TrainingProgram, TrainingEnrollment } from '../types';

export const getPrograms = async (params?: any): Promise<ApiResponse<TrainingProgram[]>> => {
  const { data } = await axiosInstance.get('/training/programs', { params });
  return data;
};

export const getProgramById = async (id: string): Promise<ApiResponse<TrainingProgram>> => {
  const { data } = await axiosInstance.get(`/training/programs/${id}`);
  return data;
};

export const createProgram = async (program: Partial<TrainingProgram>): Promise<ApiResponse<TrainingProgram>> => {
  const { data } = await axiosInstance.post('/training/programs', program);
  return data;
};

export const updateProgram = async (id: string, updates: Partial<TrainingProgram>): Promise<ApiResponse<TrainingProgram>> => {
  const { data } = await axiosInstance.put(`/training/programs/${id}`, updates);
  return data;
};

export const deleteProgram = async (id: string): Promise<ApiResponse<{ message: string }>> => {
  const { data } = await axiosInstance.delete(`/training/programs/${id}`);
  return data;
};

export const enrollInProgram = async (programId: string): Promise<ApiResponse<TrainingEnrollment>> => {
  const { data } = await axiosInstance.post(`/training/programs/${programId}/enroll`);
  return data;
};

export const getMyEnrollments = async (): Promise<ApiResponse<TrainingEnrollment[]>> => {
  const { data } = await axiosInstance.get('/training/enrollments/mine');
  return data;
};

export const getPendingApprovals = async (): Promise<ApiResponse<TrainingEnrollment[]>> => {
  const { data } = await axiosInstance.get('/training/enrollments/pending-approval');
  return data;
};

export const approveEnrollment = async (id: string): Promise<ApiResponse<TrainingEnrollment>> => {
  const { data } = await axiosInstance.put(`/training/enrollments/${id}/approve`);
  return data;
};

export const rejectEnrollment = async (id: string, reason: string): Promise<ApiResponse<TrainingEnrollment>> => {
  const { data } = await axiosInstance.put(`/training/enrollments/${id}/reject`, { reason });
  return data;
};

export const markAttended = async (id: string): Promise<ApiResponse<TrainingEnrollment>> => {
  const { data } = await axiosInstance.put(`/training/enrollments/${id}/mark-attended`);
  return data;
};

export const completeEnrollment = async (id: string, payload: any): Promise<ApiResponse<TrainingEnrollment>> => {
  const { data } = await axiosInstance.put(`/training/enrollments/${id}/complete`, payload);
  return data;
};