import express from 'express';
import { getCycles, getCycleById, createCycle, updateCycle, getMyAppraisals, submitSelfAssessment, submitReviewerAssessment, getDepartmentAppraisals } from '../controllers/appraisalController';
import { protect } from '../middlewares/auth';
import { authorize } from '../middlewares/rbac';

const router = express.Router();
router.use(protect);

// Cycles
router.get('/cycles', getCycles);
router.get('/cycles/:id', getCycleById);
router.post('/cycles', authorize('administrator'), createCycle);
router.put('/cycles/:id', authorize('administrator'), updateCycle);

// Appraisals
router.get('/mine', getMyAppraisals);
router.post('/self-assessment', authorize('faculty_member', 'hod'), submitSelfAssessment);
router.put('/:id/reviewer-assessment', authorize('hod', 'dean', 'administrator'), submitReviewerAssessment);
router.get('/department/:deptId', authorize('hod', 'dean', 'administrator'), getDepartmentAppraisals);

export default router;
