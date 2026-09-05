import axiosInstance from './axiosInstance';
import type { ApiResponse, User } from '../types';

export const getAllUsers = async (params?: any): Promise<ApiResponse<User[]>> => {
  const { data } = await axiosInstance.get('/users', { params });
  return data;
};

export const getPublicFacultyDirectory = async (): Promise<ApiResponse<User[]>> => {
  const { data } = await axiosInstance.get('/users/public-directory');
  return data;
};

export const createUser = async (user: any): Promise<ApiResponse<User>> => {
  const { data } = await axiosInstance.post('/users', user);
  return data;
};

export const updateUser = async (id: string, updates: any): Promise<ApiResponse<User>> => {
  const { data } = await axiosInstance.put(`/users/${id}`, updates);
  return data;
};

export const deleteUser = async (id: string): Promise<ApiResponse<any>> => {
  const { data } = await axiosInstance.delete(`/users/${id}`);
  return data;
};

export const resetUserPassword = async (id: string, newPassword: string): Promise<ApiResponse<{ message: string }>> => {
  const { data } = await axiosInstance.put(`/users/${id}/reset-password`, { newPassword });
  return data;
};