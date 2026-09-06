import express from 'express';
import {
  getPublicNotices,
  getAllNotices,
  createNotice,
  updateNotice,
  deleteNotice,
} from '../controllers/noticeController';
import { protect } from '../middlewares/auth';
import { authorize } from '../middlewares/rbac';

const router = express.Router();

// Public — no auth required
router.get('/public', getPublicNotices);

// All routes below require authentication
router.use(protect);
router.get('/', authorize('administrator', 'dean', 'hod', 'hr'), getAllNotices);
router.post('/', authorize('administrator', 'dean'), createNotice);
router.put('/:id', authorize('administrator', 'dean'), updateNotice);
router.delete('/:id', authorize('administrator'), deleteNotice);

export default router;
