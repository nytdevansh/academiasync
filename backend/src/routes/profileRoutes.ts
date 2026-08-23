import express from 'express';
import { getMyProfile, updateMyProfile, getProfileByUserId, getProfilesByDepartment } from '../controllers/profileController';
import { protect } from '../middlewares/auth';
import { authorize } from '../middlewares/rbac';

const router = express.Router();
router.use(protect);

router.get('/me', getMyProfile);
router.put('/me', updateMyProfile);
router.get('/department/:deptId', authorize('administrator', 'hod', 'dean', 'hr'), getProfilesByDepartment);
router.get('/:userId', authorize('administrator', 'hod', 'dean', 'hr'), getProfileByUserId);

export default router;
