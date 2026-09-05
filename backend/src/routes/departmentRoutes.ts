import express from 'express';
import { getAllDepartments, getDepartmentById, createDepartment, updateDepartment, deleteDepartment } from '../controllers/departmentController';
import { protect } from '../middlewares/auth';
import { authorize } from '../middlewares/rbac';

const router = express.Router();

router.get('/', getAllDepartments);
router.get('/:id', getDepartmentById);

router.use(protect);
router.post('/', authorize('administrator'), createDepartment);
router.put('/:id', authorize('administrator'), updateDepartment);
router.delete('/:id', authorize('administrator'), deleteDepartment);

export default router;
