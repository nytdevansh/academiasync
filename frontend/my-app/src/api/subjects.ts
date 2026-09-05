import axiosInstance from './axiosInstance';
import type { ApiResponse, Subject } from '../types';

export const getAllSubjects = async (): Promise<ApiResponse<Subject[]>> => {
  const { data } = await axiosInstance.get('/subjects');
  return data;
};

export const getSubjectsByDepartment = async (deptId: string): Promise<ApiResponse<Subject[]>> => {
  const { data } = await axiosInstance.get(`/subjects/department/${deptId}`);
  return data;
};

export const createSubject = async (payload: Partial<Subject>): Promise<ApiResponse<Subject>> => {
  const { data } = await axiosInstance.post('/subjects', payload);
  return data;
};

export const updateSubject = async (id: string, payload: Partial<Subject>): Promise<ApiResponse<Subject>> => {
  const { data } = await axiosInstance.put(`/subjects/${id}`, payload);
  return data;
};

export const deleteSubject = async (id: string): Promise<ApiResponse<{ message: string }>> => {
  const { data } = await axiosInstance.delete(`/subjects/${id}`);
  return data;
};
