import axiosInstance from './axiosInstance';
import type { ApiResponse } from '../types';

export interface CourseModule {
  _id?: string;
  title: string;
  order: number;
  type: 'video' | 'document' | 'link' | 'quiz';
  contentUrl: string;
  durationMinutes?: number;
  isRequired: boolean;
  description?: string;
}

export interface CourseContent {
  _id?: string;
  programId: string;
  externalCourseUrl?: string;
  externalLmsProvider?: string;
  modules: CourseModule[];
  passingAttendancePercentage: number;
  createdBy?: any;
}

export interface AttendanceSession {
  _id?: string;
  sessionDate: string;
  sessionTitle: string;
  present: boolean;
  markedBy?: any;
  markedAt?: string;
  notes?: string;
}

export interface AttendanceRecord {
  _id?: string;
  programId: string;
  enrollmentId: string;
  userId: any;
  sessions: AttendanceSession[];
  attendancePercentage: number;
  isSatisfied: boolean;
}

export interface AssessmentQuestion {
  _id?: string;
  prompt: string;
  type: 'mcq' | 'short_answer' | 'file_upload';
  options?: string[];
  correctAnswer?: number;
  maxScore: number;
  rubricGuide?: string;
}

export interface CourseAssessment {
  _id?: string;
  programId: string;
  title: string;
  instructions?: string;
  passingScore: number;
  timeLimitMinutes?: number;
  questions: AssessmentQuestion[];
  isActive?: boolean;
}

export interface CourseAssessmentSubmission {
  _id?: string;
  assessmentId: any;
  programId: string;
  enrollmentId: string;
  userId: any;
  answers: {
    questionIndex: number;
    selectedOption?: number;
    answerText?: string;
    fileUrl?: string;
    score?: number;
    feedback?: string;
  }[];
  totalScore: number;
  maxPossibleScore: number;
  percentageScore: number;
  passed: boolean;
  status: 'submitted' | 'graded';
  gradedBy?: any;
  submittedAt: string;
  gradedAt?: string;
}

// ── Course Content (LMS) ──
export const getCourseContent = async (programId: string): Promise<ApiResponse<CourseContent> & { userProgress?: string[] }> => {
  const { data } = await axiosInstance.get(`/training/programs/${programId}/content`);
  return data;
};

export const upsertCourseContent = async (programId: string, payload: Partial<CourseContent>): Promise<ApiResponse<CourseContent>> => {
  const { data } = await axiosInstance.put(`/training/programs/${programId}/content`, payload);
  return data;
};

export const toggleModuleProgress = async (programId: string, moduleId: string): Promise<ApiResponse<any>> => {
  const { data } = await axiosInstance.post(`/training/programs/${programId}/modules/${moduleId}/toggle-progress`);
  return data;
};

// ── Attendance Tracking ──
export const getProgramAttendance = async (
  programId: string
): Promise<ApiResponse<any> & { enrollments?: any[]; attendanceRecords?: any[] }> => {
  const { data } = await axiosInstance.get(`/training/programs/${programId}/attendance`);
  return data;
};

export const markSessionAttendance = async (
  programId: string,
  payload: {
    sessionDate: string;
    sessionTitle: string;
    attendees: { enrollmentId: string; userId: string; present: boolean; notes?: string }[];
  }
): Promise<ApiResponse<any>> => {
  const { data } = await axiosInstance.post(`/training/programs/${programId}/attendance/mark-session`, payload);
  return data;
};

export const getMyAttendance = async (programId: string): Promise<ApiResponse<AttendanceRecord> & { enrollmentStatus?: string }> => {
  const { data } = await axiosInstance.get(`/training/programs/${programId}/attendance/mine`);
  return data;
};

// ── Course Assessments ──
export const getCourseAssessment = async (programId: string): Promise<ApiResponse<CourseAssessment>> => {
  const { data } = await axiosInstance.get(`/training/programs/${programId}/assessment`);
  return data;
};

export const upsertCourseAssessment = async (programId: string, payload: Partial<CourseAssessment>): Promise<ApiResponse<CourseAssessment>> => {
  const { data } = await axiosInstance.put(`/training/programs/${programId}/assessment`, payload);
  return data;
};

export const submitCourseAssessment = async (
  programId: string,
  answers: { questionIndex: number; selectedOption?: number; answerText?: string; fileUrl?: string }[]
): Promise<ApiResponse<CourseAssessmentSubmission> & { summary?: any }> => {
  const { data } = await axiosInstance.post(`/training/programs/${programId}/assessment/submit`, { answers });
  return data;
};

export const getMySubmission = async (programId: string): Promise<ApiResponse<CourseAssessmentSubmission>> => {
  const { data } = await axiosInstance.get(`/training/programs/${programId}/assessment/mine`);
  return data;
};

export const getProgramSubmissions = async (programId: string): Promise<ApiResponse<CourseAssessmentSubmission[]>> => {
  const { data } = await axiosInstance.get(`/training/programs/${programId}/assessment/submissions`);
  return data;
};

export const gradeSubmission = async (
  programId: string,
  subId: string,
  payload: { answers?: any[]; totalScore: number; passed?: boolean }
): Promise<ApiResponse<CourseAssessmentSubmission>> => {
  const { data } = await axiosInstance.put(`/training/programs/${programId}/assessment/submissions/${subId}/grade`, payload);
  return data;
};
