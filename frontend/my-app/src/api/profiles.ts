import axiosInstance from './axiosInstance';
import type { ApiResponse, FacultyProfile } from '../types';

export const getMyProfile = async (): Promise<ApiResponse<FacultyProfile>> => {
  const { data } = await axiosInstance.get('/profiles/me');
  return data;
};

export const updateMyProfile = async (profileData: Partial<FacultyProfile>): Promise<ApiResponse<FacultyProfile>> => {
  const { data } = await axiosInstance.put('/profiles/me', profileData);
  return data;
};

export const getProfileByUserId = async (userId: string): Promise<ApiResponse<FacultyProfile>> => {
  const { data } = await axiosInstance.get(`/profiles/${userId}`);
  return data;
};

export const getProfilesByDepartment = async (deptId: string): Promise<ApiResponse<FacultyProfile[]>> => {
  const { data } = await axiosInstance.get(`/profiles/department/${deptId}`);
  return data;
};