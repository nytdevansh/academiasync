import express from 'express';
import { getPublicFacultyDirectory, getAllUsers, getUsersByDepartment, getUserById, createUser, updateUser, deleteUser, resetPassword, revokeUserSessions } from '../controllers/userController';
import { protect } from '../middlewares/auth';
import { authorize } from '../middlewares/rbac';

const router = express.Router();

router.get('/public-directory', getPublicFacultyDirectory);

router.use(protect);

router.get('/', authorize('administrator'), getAllUsers);
router.post('/', authorize('administrator'), createUser);
router.get('/department/:deptId', authorize('administrator', 'hod', 'dean'), getUsersByDepartment);
router.get('/:id', authorize('administrator', 'hod', 'dean', 'hr'), getUserById);
router.put('/:id', authorize('administrator'), updateUser);
router.delete('/:id', authorize('administrator'), deleteUser);
router.put('/:id/reset-password', authorize('administrator'), resetPassword);
router.post('/:id/revoke-sessions', authorize('administrator'), revokeUserSessions);

export default router;
