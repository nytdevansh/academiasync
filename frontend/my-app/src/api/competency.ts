import axiosInstance from './axiosInstance';
import type { ApiResponse, CompetencyRecord, SkillArea } from '../types';

export const getSkillAreas = async (): Promise<ApiResponse<SkillArea[]>> => {
  const { data } = await axiosInstance.get('/competency/skill-areas');
  return data;
};

export const getMyCompetency = async (): Promise<ApiResponse<CompetencyRecord[]>> => {
  const { data } = await axiosInstance.get('/competency/me');
  return data;
};

export const updateMyCompetency = async (record: any): Promise<ApiResponse<CompetencyRecord>> => {
  const { data } = await axiosInstance.put('/competency/me', record);
  return data;
};

export const getDepartmentCompetency = async (deptId: string): Promise<ApiResponse<CompetencyRecord[]>> => {
  const { data } = await axiosInstance.get(`/competency/department/${deptId}`);
  return data;
};

export const getGapAnalysis = async (deptId: string): Promise<ApiResponse<any[]>> => {
  const { data } = await axiosInstance.get(`/competency/gap-analysis/${deptId}`);
  return data;
};

export const assessCompetency = async (
  id: string,
  payload: {
    currentLevel?: string;
    targetLevel?: string;
    gapsIdentified?: string[];
    notes?: string;
    score?: number;
    rubricScores?: any[];
  }
): Promise<ApiResponse<CompetencyRecord>> => {
  const { data } = await axiosInstance.put(`/competency/${id}/assess`, payload);
  return data;
};