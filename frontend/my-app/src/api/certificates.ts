import axiosInstance from './axiosInstance';
import type { ApiResponse } from '../types';
import axios from 'axios';
import { API_BASE } from '../utils/constants';

export interface IssuedCertificate {
  _id: string;
  certificateNumber: string;
  teacherId: any;
  courseId: {
    _id: string;
    title: string;
    organizer?: string;
    type?: string;
    mode?: string;
    startDate?: string;
    endDate?: string;
  };
  enrollmentId: string;
  resultId: string;
  verificationToken: string;
  issuedDate: string;
  expiryDate?: string;
  status: 'valid' | 'revoked';
  supersedes?: {
    _id: string;
    certificateNumber: string;
    issuedDate: string;
    status: string;
  };
  metadata?: {
    teacherName: string;
    courseTitle: string;
    department: string;
    grade?: string;
    validityYears?: number;
  };
  isValid?: boolean;
}

export interface PublicVerificationData {
  certificateNumber: string;
  teacherName: string;
  courseTitle: string;
  department: string;
  issuedDate: string;
  expiryDate: string;
  status: 'VALID' | 'EXPIRED' | 'REVOKED';
  issuerName: string;
  revokedAt?: string;
  revokedReason?: string;
}

/**
 * Fetches all official certificates issued to the authenticated faculty member.
 */
export const getMyCertificates = async (): Promise<ApiResponse<IssuedCertificate[]>> => {
  const { data } = await axiosInstance.get('/certificates/mine');
  return data;
};

/**
 * Public zero-auth verification call for anyone validating an institutional badge.
 * Uses vanilla Axios to guarantee no Authorization header is attached or required.
 */
export const getPublicCertificate = async (token: string): Promise<ApiResponse<PublicVerificationData>> => {
  const { data } = await axios.get(`${API_BASE}/certificates/verify/${token}`);
  return data;
};

/**
 * Administrative endpoint to revoke a certificate.
 */
export const revokeCertificate = async (
  id: string,
  reason: string
): Promise<ApiResponse<IssuedCertificate>> => {
  const { data } = await axiosInstance.post(`/certificates/${id}/revoke`, { reason });
  return data;
};
