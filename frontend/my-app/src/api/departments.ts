import axiosInstance from './axiosInstance';
import type { ApiResponse, Department } from '../types';

export const getAllDepartments = async (): Promise<ApiResponse<Department[]>> => {
  const { data } = await axiosInstance.get('/departments');
  return data;
};

export const createDepartment = async (dept: Partial<Department>): Promise<ApiResponse<Department>> => {
  const { data } = await axiosInstance.post('/departments', dept);
  return data;
};

export const updateDepartment = async (id: string, updates: Partial<Department>): Promise<ApiResponse<Department>> => {
  const { data } = await axiosInstance.put(`/departments/${id}`, updates);
  return data;
};