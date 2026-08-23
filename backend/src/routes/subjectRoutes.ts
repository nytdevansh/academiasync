import express from 'express';
import { getAllSubjects, getSubjectsByDepartment, createSubject, updateSubject, deleteSubject } from '../controllers/subjectController';
import { protect } from '../middlewares/auth';
import { authorize } from '../middlewares/rbac';

const router = express.Router();
router.use(protect);

router.get('/', getAllSubjects);
router.get('/department/:deptId', getSubjectsByDepartment);
router.post('/', authorize('administrator', 'hod'), createSubject);
router.put('/:id', authorize('administrator', 'hod'), updateSubject);
router.delete('/:id', authorize('administrator'), deleteSubject);

export default router;
