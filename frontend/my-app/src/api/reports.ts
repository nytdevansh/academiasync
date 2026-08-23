import axiosInstance from './axiosInstance';
import type { ApiResponse } from '../types';

export const getDashboardStats = async (): Promise<ApiResponse<any>> => {
  const { data } = await axiosInstance.get('/reports/dashboard-stats');
  return data;
};

export const getTrainingParticipation = async (params?: any): Promise<ApiResponse<any>> => {
  const { data } = await axiosInstance.get('/reports/training-participation', { params });
  return data;
};

export const getCompetencySummary = async (): Promise<ApiResponse<any>> => {
  const { data } = await axiosInstance.get('/reports/competency-summary');
  return data;
};

export const getAppraisalScores = async (): Promise<ApiResponse<any>> => {
  const { data } = await axiosInstance.get('/reports/appraisal-scores');
  return data;
};

export const getFacultyOverview = async (): Promise<ApiResponse<any>> => {
  const { data } = await axiosInstance.get('/reports/faculty-overview');
  return data;
};