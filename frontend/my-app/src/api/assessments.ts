import axiosInstance from './axiosInstance';
import type { ApiResponse, Assessment, AssessmentResponse, AssessmentAnalytics } from '../types';

export const getAssessments = async (params?: {
  status?: string;
  topic?: string;
  isTemplate?: boolean;
  search?: string;
}): Promise<ApiResponse<Assessment[]>> => {
  const response = await axiosInstance.get<ApiResponse<Assessment[]>>('/assessments', { params });
  return response.data;
};

export const getAssessmentById = async (id: string): Promise<ApiResponse<Assessment>> => {
  const response = await axiosInstance.get<ApiResponse<Assessment>>(`/assessments/${id}`);
  return response.data;
};

export const createAssessment = async (data: Partial<Assessment>): Promise<ApiResponse<Assessment>> => {
  const response = await axiosInstance.post<ApiResponse<Assessment>>('/assessments', data);
  return response.data;
};

export const updateAssessment = async (id: string, data: Partial<Assessment>): Promise<ApiResponse<Assessment>> => {
  const response = await axiosInstance.patch<ApiResponse<Assessment>>(`/assessments/${id}`, data);
  return response.data;
};

export const deleteAssessment = async (id: string): Promise<ApiResponse<{ message: string }>> => {
  const response = await axiosInstance.delete<ApiResponse<{ message: string }>>(`/assessments/${id}`);
  return response.data;
};

export const publishAssessment = async (id: string): Promise<ApiResponse<Assessment>> => {
  const response = await axiosInstance.post<ApiResponse<Assessment>>(`/assessments/${id}/publish`);
  return response.data;
};

export const closeAssessment = async (id: string): Promise<ApiResponse<Assessment>> => {
  const response = await axiosInstance.post<ApiResponse<Assessment>>(`/assessments/${id}/close`);
  return response.data;
};

export const startAssessment = async (id: string): Promise<ApiResponse<{
  assessmentId: string;
  attemptNumber: number;
  startedAt: string;
  timeLimitMinutes?: number;
}>> => {
  const response = await axiosInstance.post<ApiResponse<{
    assessmentId: string;
    attemptNumber: number;
    startedAt: string;
    timeLimitMinutes?: number;
  }>>(`/assessments/${id}/start`);
  return response.data;
};

export const submitAssessmentResponse = async (
  id: string,
  data: { answers: { questionId: string; answer: any }[]; startedAt?: string; attemptNumber?: number }
): Promise<ApiResponse<AssessmentResponse>> => {
  const response = await axiosInstance.post<ApiResponse<AssessmentResponse>>(`/assessments/${id}/responses`, data);
  return response.data;
};

export const getAssessmentResponses = async (
  id: string
): Promise<ApiResponse<{ assessment: Assessment; responses: AssessmentResponse[]; analytics: AssessmentAnalytics }>> => {
  const response = await axiosInstance.get<ApiResponse<{ assessment: Assessment; responses: AssessmentResponse[]; analytics: AssessmentAnalytics }>>(
    `/assessments/${id}/responses`
  );
  return response.data;
};

export const getFacultyAssessmentResponse = async (
  id: string,
  facultyId: string
): Promise<ApiResponse<AssessmentResponse>> => {
  const response = await axiosInstance.get<ApiResponse<AssessmentResponse>>(`/assessments/${id}/responses/${facultyId}`);
  return response.data;
};

export const gradeAssessmentResponse = async (
  id: string,
  facultyId: string,
  data: {
    questionScores?: { questionId: string; score: number; feedback?: string }[];
    reviewerNotes?: string;
  }
): Promise<ApiResponse<AssessmentResponse>> => {
  const response = await axiosInstance.patch<ApiResponse<AssessmentResponse>>(`/assessments/${id}/responses/${facultyId}/grade`, data);
  return response.data;
};

export const downloadAssessmentCsv = async (id: string, title?: string): Promise<void> => {
  const response = await axiosInstance.get(`/assessments/${id}/export`, {
    responseType: 'blob',
  });
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${(title || 'assessment').replace(/[^a-zA-Z0-9_-]/g, '_')}_results.csv`);
  document.body.appendChild(link);
  link.click();
  link.remove();
};
