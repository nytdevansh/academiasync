import express from 'express';
import { getAuditLogs } from '../controllers/auditController';
import { protect } from '../middlewares/auth';
import { authorize } from '../middlewares/rbac';

const router = express.Router();
router.use(protect);

router.get('/', authorize('administrator'), getAuditLogs);

export default router;
