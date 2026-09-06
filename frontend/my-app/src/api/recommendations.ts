import axiosInstance from './axiosInstance';
import type { ApiResponse } from '../types';

export interface TrainingRecommendation {
  _id: string;
  facultyId: any;
  programId?: any;
  skillAreaId?: any;
  recommendedBy: any;
  recommendedDate: string;
  reason: string;
  dueDate: string;
  status: 'pending' | 'enrolled' | 'completed' | 'overdue' | 'ignored';
  scoreBeforeRecommendation?: number;
  scoreAfterCompletion?: number;
  improvementDelta?: number;
  enrollmentId?: string;
  notes?: string;
  declineReason?: string;
  declinedAt?: string;
  createdAt: string;
}

export interface ComplianceStats {
  total: number;
  pending: number;
  overdue: number;
  completed: number;
  ignored?: number;
  complianceRate: number;
}

// Faculty
export const getMyRecommendations = async (): Promise<ApiResponse<TrainingRecommendation[]>> => {
  const { data } = await axiosInstance.get('/recommendations/mine');
  return data;
};

export const enrollFromRecommendation = async (id: string): Promise<ApiResponse<any>> => {
  const { data } = await axiosInstance.post(`/recommendations/${id}/enroll`);
  return data;
};

export const ignoreRecommendation = async (id: string, reason?: string): Promise<ApiResponse<any>> => {
  const { data } = await axiosInstance.put(`/recommendations/${id}/ignore`, { reason });
  return data;
};

// HOD / Dean / Admin
export const createRecommendation = async (payload: {
  facultyId?: string;
  facultyIds?: string[];
  departmentId?: string;
  programId?: string;
  skillAreaId?: string;
  reason: string;
  dueDate: string;
  notes?: string;
  sendEmail?: boolean;
}): Promise<ApiResponse<any>> => {
  const { data } = await axiosInstance.post('/recommendations', payload);
  return data;
};


export const getDepartmentRecommendations = async (deptId: string): Promise<ApiResponse<TrainingRecommendation[]>> => {
  const { data } = await axiosInstance.get(`/recommendations/department/${deptId}`);
  return data;
};

export const getComplianceStats = async (deptId: string): Promise<ApiResponse<ComplianceStats>> => {
  const { data } = await axiosInstance.get(`/recommendations/compliance-stats/${deptId}`);
  return data;
};

export const recordPostAssessment = async (
  id: string,
  scoreAfterCompletion: number,
  forceUpdate?: boolean
): Promise<ApiResponse<TrainingRecommendation>> => {
  const { data } = await axiosInstance.put(`/recommendations/${id}/complete-assessment`, {
    scoreAfterCompletion,
    forceUpdate,
  });
  return data;
};

export const triggerComplianceSweep = async (): Promise<ApiResponse<{ message: string }>> => {
  const { data } = await axiosInstance.post('/recommendations/run-compliance-sweep');
  return data;
};
