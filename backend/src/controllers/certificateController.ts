import { Request, Response } from 'express';
import Certificate from '../models/Certificate';
import { verifyCertificateToken } from '../services/certificateService';
import { AuthRequest } from '../middlewares/auth';
import { logAudit } from '../services/auditService';
import { notify } from '../services/notificationService';

/**
 * Public zero-auth endpoint for credential verification.
 * Anyone with the verification token can verify the authentic institutional badge.
 * Numeric scores are strictly omitted for privacy.
 */
export const verifyCertificate = async (req: Request, res: Response): Promise<void> => {
  try {
    const token = (Array.isArray(req.params.token) ? req.params.token[0] : req.params.token) as string;
    if (!token) {
      res.status(400).json({ success: false, error: 'Verification token is required' });
      return;
    }

    const verification = await verifyCertificateToken(token);
    res.json({ success: true, data: verification });
  } catch (err: any) {
    res.status(400).json({
      success: false,
      error: err.message || 'Invalid or unverifiable certificate token',
    });
  }
};

/**
 * Authenticated endpoint for faculty to fetch all their issued credentials.
 */
export const getMyCertificates = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id;
    const certificates = await Certificate.find({ teacherId: userId })
      .populate('courseId', 'title organizer type mode startDate endDate')
      .populate('supersedes', 'certificateNumber issuedDate status')
      .sort({ issuedDate: -1 });

    res.json({ success: true, data: certificates });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * Administrative revocation endpoint.
 * Gated strictly to administrator role. Sets revoked status and records audit metadata.
 */
export const revokeCertificate = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason || typeof reason !== 'string') {
      res.status(400).json({ success: false, error: 'A revocation justification reason is required.' });
      return;
    }

    const cert = await Certificate.findById(id);
    if (!cert) {
      res.status(404).json({ success: false, error: 'Certificate not found' });
      return;
    }

    if (cert.status === 'revoked') {
      res.status(400).json({ success: false, error: 'Certificate is already revoked' });
      return;
    }

    cert.status = 'revoked';
    cert.revokedAt = new Date();
    cert.revokedBy = req.user?._id as any;
    cert.revokedReason = reason;
    await cert.save();

    await logAudit(
      req.user?._id,
      'update',
      'Certificate',
      cert._id,
      `Revoked Certificate ${cert.certificateNumber}. Reason: ${reason}`,
      { status: 'valid' },
      { status: 'revoked', reason },
      req.ip,
      req.headers['user-agent']
    );

    // Notify certificate holder (In-app + Email)
    await notify({
      userId: cert.teacherId,
      type: 'training',
      title: 'Important: Certificate Revoked',
      message: `Your Certificate ${cert.certificateNumber} for "${cert.metadata?.courseTitle || 'Training Course'}" has been revoked by administration. Reason: ${reason}`,
      channels: ['in_app', 'email'],
      emailData: {
        template: 'certificateRevoked',
        subject: `Administrative Notice: Certificate ${cert.certificateNumber} Revoked`,
        variables: {
          courseTitle: cert.metadata?.courseTitle || 'Training Course',
          certificateNumber: cert.certificateNumber,
          revocationDate: new Date().toLocaleDateString(),
          reason,
          supportUrl: `${process.env.CLIENT_URL || 'http://localhost:5173'}/certificates`,
        },
      },
      relatedEntityType: 'Certificate',
      relatedEntityId: cert._id,
    });

    res.json({
      success: true,
      message: `Certificate ${cert.certificateNumber} has been revoked`,
      data: cert,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};
