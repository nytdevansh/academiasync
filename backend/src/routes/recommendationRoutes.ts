import express from 'express';
import {
  createRecommendation,
  getMyRecommendations,
  getDepartmentRecommendations,
  getComplianceStats,
  enrollFromRecommendation,
  recordPostAssessment,
  ignoreRecommendation,
  triggerComplianceSweep,
} from '../controllers/recommendationController';
import { protect } from '../middlewares/auth';
import { authorize } from '../middlewares/rbac';

const router = express.Router();
router.use(protect);

// HOD / Dean / Admin create a recommendation (Single or Bulk)
router.post('/', authorize('hod', 'dean', 'administrator'), createRecommendation);

// Faculty: view & act on their recommendations
router.get('/mine', getMyRecommendations);
router.post('/:id/enroll', authorize('faculty_member', 'hod'), enrollFromRecommendation);
router.put('/:id/ignore', authorize('faculty_member', 'hod', 'administrator'), ignoreRecommendation);

// HOD / Dean compliance views
router.get('/department/:deptId', authorize('hod', 'dean', 'administrator'), getDepartmentRecommendations);
router.get('/compliance-stats/:deptId', authorize('hod', 'dean', 'administrator'), getComplianceStats);

// HOD / Dean records post-training assessment
router.put('/:id/complete-assessment', authorize('hod', 'dean', 'administrator'), recordPostAssessment);

// Webhook / Manual Compliance sweep trigger
router.post('/run-compliance-sweep', authorize('administrator', 'dean'), triggerComplianceSweep);

export default router;
