import express from 'express';
import {
  getMyNotifications,
  markAsRead,
  markAllRead,
  archiveNotification,
  deleteNotification,
  broadcastNotification
} from '../controllers/notificationController';
import { protect } from '../middlewares/auth';
import { authorize } from '../middlewares/rbac';

const router = express.Router();
router.use(protect);

router.get('/mine', getMyNotifications);
router.put('/mark-all-read', markAllRead);
router.put('/:id/read', markAsRead);
router.put('/:id/archive', archiveNotification);
router.delete('/:id', deleteNotification);
router.post('/broadcast', authorize('administrator', 'dean'), broadcastNotification);

export default router;

