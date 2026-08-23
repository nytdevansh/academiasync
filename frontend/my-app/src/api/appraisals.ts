import axiosInstance from './axiosInstance';
import type { ApiResponse, Appraisal, AppraisalCycle } from '../types';

export const getCycles = async (): Promise<ApiResponse<AppraisalCycle[]>> => {
  const { data } = await axiosInstance.get('/appraisals/cycles');
  return data;
};

export const createCycle = async (cycle: Partial<AppraisalCycle>): Promise<ApiResponse<AppraisalCycle>> => {
  const { data } = await axiosInstance.post('/appraisals/cycles', cycle);
  return data;
};

export const getMyAppraisals = async (): Promise<ApiResponse<Appraisal[]>> => {
  const { data } = await axiosInstance.get('/appraisals/mine');
  return data;
};

export const submitSelfAssessment = async (payload: any): Promise<ApiResponse<Appraisal>> => {
  const { data } = await axiosInstance.post('/appraisals/self-assessment', payload);
  return data;
};

export const submitReviewerAssessment = async (id: string, payload: any): Promise<ApiResponse<Appraisal>> => {
  const { data } = await axiosInstance.put(`/appraisals/${id}/reviewer-assessment`, payload);
  return data;
};

export const getDepartmentAppraisals = async (deptId: string): Promise<ApiResponse<Appraisal[]>> => {
  const { data } = await axiosInstance.get(`/appraisals/department/${deptId}`);
  return data;
};