import express from 'express';
import { getMyNotifications, markAsRead, markAllRead, archiveNotification } from '../controllers/notificationController';
import { protect } from '../middlewares/auth';

const router = express.Router();
router.use(protect);

router.get('/mine', getMyNotifications);
router.put('/mark-all-read', markAllRead);
router.put('/:id/read', markAsRead);
router.put('/:id/archive', archiveNotification);

export default router;
