import express from 'express';
import {
  verifyCertificate,
  getMyCertificates,
  revokeCertificate,
} from '../controllers/certificateController';
import { protect } from '../middlewares/auth';
import { authorize } from '../middlewares/rbac';

const router = express.Router();

// Public zero-auth endpoint for external and institutional verification
router.get('/verify/:token', verifyCertificate);

// Protected routes
router.get('/mine', protect, getMyCertificates);
router.post('/:id/revoke', protect, authorize('administrator'), revokeCertificate);

export default router;
