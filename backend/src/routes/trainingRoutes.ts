import express from 'express';
import {
  getPrograms, getProgramById, createProgram, updateProgram, deleteProgram,
  enrollInProgram, getMyEnrollments, getPendingApprovals, getEnrollmentsByDepartment,
  approveEnrollment, rejectEnrollment, markAttended, completeEnrollment
} from '../controllers/trainingController';
import {
  getCourseContent, upsertCourseContent, toggleModuleProgress,
  getProgramAttendance, markSessionAttendance, getMyAttendance,
  getCourseAssessment, upsertCourseAssessment, submitCourseAssessment,
  getMySubmission, getProgramSubmissions, gradeSubmission
} from '../controllers/lmsController';
import { protect } from '../middlewares/auth';
import { authorize } from '../middlewares/rbac';

const router = express.Router();
router.use(protect);

// Programs
router.get('/programs', getPrograms);
router.get('/programs/:id', getProgramById);
router.post('/programs', authorize('administrator', 'hod', 'dean'), createProgram);
router.put('/programs/:id', authorize('administrator', 'hod', 'dean'), updateProgram);
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

// Course Content & Modules (LMS)
router.get('/programs/:id/content', getCourseContent);
router.put('/programs/:id/content', authorize('administrator', 'hod', 'dean'), upsertCourseContent);
router.post('/programs/:id/modules/:moduleId/toggle-progress', authorize('faculty_member', 'hod'), toggleModuleProgress);

// Attendance Tracking
router.get('/programs/:id/attendance', authorize('hod', 'dean', 'administrator'), getProgramAttendance);
router.post('/programs/:id/attendance/mark-session', authorize('hod', 'dean', 'administrator'), markSessionAttendance);
router.get('/programs/:id/attendance/mine', getMyAttendance);

// Course Assessment & Evidence Testing
router.get('/programs/:id/assessment', getCourseAssessment);
router.put('/programs/:id/assessment', authorize('administrator', 'hod', 'dean'), upsertCourseAssessment);
router.post('/programs/:id/assessment/submit', authorize('faculty_member', 'hod'), submitCourseAssessment);
router.get('/programs/:id/assessment/mine', getMySubmission);
router.get('/programs/:id/assessment/submissions', authorize('hod', 'dean', 'administrator'), getProgramSubmissions);
router.put('/programs/:id/assessment/submissions/:subId/grade', authorize('hod', 'dean', 'administrator'), gradeSubmission);

export default router;
