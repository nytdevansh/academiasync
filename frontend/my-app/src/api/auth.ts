import axiosInstance from './axiosInstance';
import type { ApiResponse, User } from '../types';

export interface AuthSuccessPayload {
  token: string;
  refreshToken?: string;
  user: User;
  _id?: string;
  name?: string;
  email?: string;
  role?: string;
  department?: any;
}

export interface RefreshTokenPayload {
  token: string;
  refreshToken?: string;
}

export const login = async (
  email: string,
  password: string
): Promise<ApiResponse<AuthSuccessPayload>> => {
  const { data } = await axiosInstance.post('/auth/login', { email, password });
  return data;
};

export const getMe = async (): Promise<ApiResponse<User>> => {
  const { data } = await axiosInstance.get('/auth/me');
  return data;
};

export const register = async (
  userData: { name: string; email: string; password: string; role?: string; department?: string }
): Promise<ApiResponse<AuthSuccessPayload>> => {
  const { data } = await axiosInstance.post('/auth/register', userData);
  return data;
};

export const refreshToken = async (token?: string): Promise<ApiResponse<RefreshTokenPayload>> => {
  const storedRefreshToken = token || localStorage.getItem('refreshToken');
  const { data } = await axiosInstance.post('/auth/refresh', {
    refreshToken: storedRefreshToken,
  });
  return data;
};

export const logout = async (token?: string): Promise<ApiResponse<Record<string, never>>> => {
  const storedRefreshToken = token || localStorage.getItem('refreshToken');
  const { data } = await axiosInstance.post('/auth/logout', {
    refreshToken: storedRefreshToken,
  });
  return data;
};

export const updateEmailPreferences = async (
  preferences: { training: boolean; appraisal: boolean; broadcasts: boolean; system: boolean }
): Promise<ApiResponse<{ training: boolean; appraisal: boolean; broadcasts: boolean; system: boolean }>> => {
  const { data } = await axiosInstance.put('/auth/preferences', preferences);
  return data;
};
