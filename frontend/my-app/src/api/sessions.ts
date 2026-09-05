import axiosInstance from './axiosInstance';
import type { ApiResponse, TrainingSession } from '../types';

export const getProgramSessions = async (programId: string): Promise<ApiResponse<TrainingSession[]>> => {
  const { data } = await axiosInstance.get(`/training/programs/${programId}/sessions`);
  return data;
};

export const getSessionById = async (sessionId: string): Promise<ApiResponse<TrainingSession>> => {
  const { data } = await axiosInstance.get(`/training/sessions/${sessionId}`);
  return data;
};

export const createSession = async (
  programId: string,
  payload: {
    title: string;
    description?: string;
    scheduledDate: string;
    startTime?: string;
    endTime?: string;
    venueOrLink?: string;
  }
): Promise<ApiResponse<TrainingSession>> => {
  const { data } = await axiosInstance.post(`/training/programs/${programId}/sessions`, payload);
  return data;
};

export const assignOrganiser = async (sessionId: string): Promise<ApiResponse<TrainingSession>> => {
  const { data } = await axiosInstance.post(`/training/sessions/${sessionId}/assign-organiser`);
  return data;
};

export const unassignOrganiser = async (sessionId: string): Promise<ApiResponse<TrainingSession>> => {
  const { data } = await axiosInstance.post(`/training/sessions/${sessionId}/unassign-organiser`);
  return data;
};

export const markSessionAttendance = async (
  sessionId: string,
  attendees: Array<{ userId: string; present: boolean; notes?: string }>
): Promise<ApiResponse<TrainingSession>> => {
  const { data } = await axiosInstance.put(`/training/sessions/${sessionId}/attendance`, { attendees });
  return data;
};
