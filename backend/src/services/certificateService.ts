import crypto from 'crypto';
import Certificate, { ICertificate } from '../models/Certificate';
import { encryptPayload, decryptPayload } from './urlEncryption.service';

export interface IssueCertificateParams {
  teacher: { _id: any; name: string };
  course: { _id: any; title: string; certificationValidityYears?: number };
  enrollmentId: any;
  resultId: any;
  departmentName?: string;
  departmentCode?: string;
  supersedesId?: any;
}

export interface PublicCertificateVerification {
  certificateNumber: string;
  teacherName: string;
  courseTitle: string;
  department: string;
  issuedDate: Date;
  expiryDate: Date;
  status: 'VALID' | 'EXPIRED' | 'REVOKED';
  issuerName: string;
  revokedAt?: Date;
  revokedReason?: string;
}

export const generateCertificateNumber = (departmentCode?: string): string => {
  const dept = (departmentCode || 'GEN').toUpperCase().replace(/[^A-Z0-9]/g, '');
  const year = new Date().getFullYear();
  const rand = crypto.randomBytes(3).toString('hex').toUpperCase(); // 6 hex characters
  return `AS-CERT-${year}-${dept}-${rand}`;
};

/**
 * Creates an immutable Certificate record with an encrypted verification token
 * and handles audit linkage to superseded certificates.
 */
export const issueCertificate = async (params: IssueCertificateParams): Promise<ICertificate> => {
  const { teacher, course, enrollmentId, resultId, departmentName, departmentCode, supersedesId } = params;

  const validityYears = course.certificationValidityYears || 2;
  const issuedDate = new Date();
  const expiryDate = new Date(issuedDate.getTime() + validityYears * 365 * 24 * 60 * 60 * 1000);
  const certificateNumber = generateCertificateNumber(departmentCode);

  // Encrypt tamper-proof verification token with AES-256-GCM
  const tokenPayload = {
    certificateNumber,
    teacherId: teacher._id.toString(),
    courseId: course._id.toString(),
    issuedAt: issuedDate.toISOString(),
  };
  const verificationToken = encryptPayload(tokenPayload, validityYears * 365 * 24 * 60 * 60);

  const cert = await Certificate.create({
    certificateNumber,
    teacherId: teacher._id,
    courseId: course._id,
    enrollmentId,
    resultId,
    issuedDate,
    expiryDate,
    status: 'valid',
    supersedes: supersedesId || undefined,
    verificationToken,
    metadata: {
      teacherName: teacher.name,
      courseTitle: course.title,
      departmentName: departmentName || 'General',
      departmentCode: departmentCode || 'GEN',
      issuerName: 'AcademiaSync National Academy',
    },
  });

  return cert;
};

/**
 * Public zero-auth verification function.
 * Validates the cryptographic token and queries MongoDB to compute derived validity.
 * Keeps numeric scores strictly private while returning the verified credential badge.
 */
export const verifyCertificateToken = async (token: string): Promise<PublicCertificateVerification> => {
  // 1. Decrypt token & verify cryptographic integrity + expiration
  const decrypted = decryptPayload<{ certificateNumber: string; teacherId: string }>(token);

  // 2. Query certificate in database
  const cert = await Certificate.findOne({ certificateNumber: decrypted.certificateNumber });
  if (!cert) {
    throw new Error('Certificate not found in institutional registry');
  }

  // 3. Compute derived validity at runtime
  let verificationStatus: 'VALID' | 'EXPIRED' | 'REVOKED' = 'VALID';
  if (cert.status === 'revoked') {
    verificationStatus = 'REVOKED';
  } else if (cert.expiryDate && new Date(cert.expiryDate).getTime() < Date.now()) {
    verificationStatus = 'EXPIRED';
  }

  return {
    certificateNumber: cert.certificateNumber,
    teacherName: cert.metadata.teacherName,
    courseTitle: cert.metadata.courseTitle,
    department: cert.metadata.departmentName,
    issuedDate: cert.issuedDate,
    expiryDate: cert.expiryDate,
    status: verificationStatus,
    issuerName: cert.metadata.issuerName,
    revokedAt: cert.revokedAt,
    revokedReason: cert.revokedReason,
  };
};
