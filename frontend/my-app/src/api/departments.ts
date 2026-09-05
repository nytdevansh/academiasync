import axiosInstance from './axiosInstance';
import type { ApiResponse, Department } from '../types';

export const getAllDepartments = async (): Promise<ApiResponse<Department[]>> => {
  const { data } = await axiosInstance.get('/departments');
  return data;
};

export const getDepartments = getAllDepartments;

export const createDepartment = async (dept: Partial<Department>): Promise<ApiResponse<Department>> => {
  const { data } = await axiosInstance.post('/departments', dept);
  return data;
};

export const getDepartmentById = async (id: string): Promise<ApiResponse<Department>> => {
  const { data } = await axiosInstance.get(`/departments/${id}`);
  return data;
};

export const updateDepartment = async (id: string, updates: Partial<Department>): Promise<ApiResponse<Department>> => {
  const { data } = await axiosInstance.put(`/departments/${id}`, updates);
  return data;
};

export const deleteDepartment = async (id: string): Promise<ApiResponse<{ message: string }>> => {
  const { data } = await axiosInstance.delete(`/departments/${id}`);
  return data;
};