import axiosInstance from './axiosInstance';
import type { ApiResponse, User } from '../types';

export const login = async (email: string, password: string): Promise<ApiResponse<{ token: string; user: User }>> => {
  const { data } = await axiosInstance.post('/auth/login', { email, password });
  return data;
};

export const getMe = async (): Promise<ApiResponse<User>> => {
  const { data } = await axiosInstance.get('/auth/me');
  return data;
};

export const register = async (userData: { name: string; email: string; password: string; role?: string; department?: string }): Promise<ApiResponse<{ token: string; user: User }>> => {
  const { data } = await axiosInstance.post('/auth/register', userData);
  return data;
};

export const refreshToken = async (): Promise<ApiResponse<{ token: string }>> => {
  const { data } = await axiosInstance.post('/auth/refresh-token');
  return data;
};

