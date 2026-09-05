import express from 'express';
import {
  getPrograms, getProgramById, createProgram, updateProgram, deleteProgram,
  enrollInProgram, getMyEnrollments, getPendingApprovals, getRetakeCandidates, getEnrollmentsByDepartment,
  approveEnrollment, rejectEnrollment, markAttended, completeEnrollment,
  resetEnrollmentForRetake
} from '../controllers/trainingController';
import {
  getCourseContent, upsertCourseContent, toggleModuleProgress,
  getProgramAttendance, markSessionAttendance, getMyAttendance,
  getCourseAssessment, upsertCourseAssessment, submitCourseAssessment,
  getMySubmission, getProgramSubmissions, gradeSubmission,
  getMyCourseResults
} from '../controllers/lmsController';
import {
  getProgramSessions,
  getSessionById,
  createSession,
  assignOrganiser,
  unassignOrganiser,
  markSessionAttendance as markTrainingSessionAttendance,
} from '../controllers/sessionController';
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
router.get('/enrollments/retake-candidates', authorize('hod', 'dean', 'administrator'), getRetakeCandidates);
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
router.get('/programs/:id/results/mine', getMyCourseResults);
router.post('/programs/:id/enrollments/:enrollmentId/reset-retake', authorize('hod', 'dean', 'administrator'), resetEnrollmentForRetake);

// Scheduled Sessions & Organiser Attendance
router.get('/programs/:id/sessions', getProgramSessions);
router.post('/programs/:id/sessions', authorize('administrator', 'hod', 'dean'), createSession);
router.get('/sessions/:sessionId', getSessionById);
router.post('/sessions/:sessionId/assign-organiser', assignOrganiser);
router.post('/sessions/:sessionId/unassign-organiser', unassignOrganiser);
router.put('/sessions/:sessionId/attendance', markTrainingSessionAttendance);

export default router;
