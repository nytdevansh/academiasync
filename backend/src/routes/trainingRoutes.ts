import express from 'express';
import {
  getPrograms, getProgramById, createProgram, updateProgram, deleteProgram,
  enrollInProgram, getMyEnrollments, getPendingApprovals, getEnrollmentsByDepartment,
  approveEnrollment, rejectEnrollment, markAttended, completeEnrollment
} from '../controllers/trainingController';
import { protect } from '../middlewares/auth';
import { authorize } from '../middlewares/rbac';

const router = express.Router();
router.use(protect);

// Programs
router.get('/programs', getPrograms);
router.get('/programs/:id', getProgramById);
router.post('/programs', authorize('administrator'), createProgram);
router.put('/programs/:id', authorize('administrator'), updateProgram);
router.delete('/programs/:id', authorize('administrator'), deleteProgram);

// Enrollments
router.post('/programs/:id/enroll', authorize('faculty_member', 'hod'), enrollInProgram);
router.get('/enrollments/mine', getMyEnrollments);
router.get('/enrollments/pending-approval', authorize('hod', 'administrator'), getPendingApprovals);
router.get('/enrollments/department/:deptId', authorize('hod', 'dean', 'administrator'), getEnrollmentsByDepartment);
router.put('/enrollments/:id/approve', authorize('hod', 'administrator'), approveEnrollment);
router.put('/enrollments/:id/reject', authorize('hod', 'administrator'), rejectEnrollment);
router.put('/enrollments/:id/mark-attended', authorize('hod', 'administrator'), markAttended);
router.put('/enrollments/:id/complete', authorize('faculty_member', 'hod'), completeEnrollment);

export default router;
