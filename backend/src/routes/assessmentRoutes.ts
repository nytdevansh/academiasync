import express from 'express';
import {
  createAssessment,
  getAssessments,
  getAssessmentById,
  updateAssessment,
  deleteAssessment,
  publishAssessment,
  closeAssessment,
  startAssessment,
  submitResponse,
  getAssessmentResponses,
  getFacultyResponse,
  gradeResponse,
  exportResponsesCsv,
} from '../controllers/assessmentController';
import { protect } from '../middlewares/auth';
import { authorize } from '../middlewares/rbac';

const router = express.Router();

// Require authentication on all assessment routes
router.use(protect);

// ── Assessment Collection & CRUD ──────────────────────────────────────────────
router.get('/', getAssessments);
router.post('/', authorize('hod', 'dean', 'administrator'), createAssessment);

router.get('/:id', getAssessmentById);
router.patch('/:id', authorize('hod', 'dean', 'administrator'), updateAssessment);
router.delete('/:id', authorize('hod', 'dean', 'administrator'), deleteAssessment);

// Lifecycle Transitions
router.post('/:id/publish', authorize('hod', 'dean', 'administrator'), publishAssessment);
router.post('/:id/close', authorize('hod', 'dean', 'administrator'), closeAssessment);

// ── Participation & Responses ──────────────────────────────────────────────────
router.post('/:id/start', startAssessment);
router.post('/:id/responses', submitResponse);

// Analytics & Review Operations
router.get('/:id/responses', authorize('hod', 'dean', 'hr', 'administrator'), getAssessmentResponses);
router.get('/:id/responses/:facultyId', authorize('hod', 'dean', 'administrator'), getFacultyResponse);
router.patch('/:id/responses/:facultyId/grade', authorize('hod', 'dean', 'administrator'), gradeResponse);
router.get('/:id/export', authorize('hod', 'dean', 'hr', 'administrator'), exportResponsesCsv);

export default router;
