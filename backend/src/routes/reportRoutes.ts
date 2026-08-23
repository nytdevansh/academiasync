import express from 'express';
import { trainingParticipation, competencySummary, appraisalScores, facultyOverview, dashboardStats } from '../controllers/reportController';
import { protect } from '../middlewares/auth';
import { authorize } from '../middlewares/rbac';

const router = express.Router();
router.use(protect);

router.get('/dashboard-stats', dashboardStats);
router.get('/training-participation', authorize('hod', 'dean', 'administrator', 'hr'), trainingParticipation);
router.get('/competency-summary', authorize('hod', 'dean', 'administrator'), competencySummary);
router.get('/appraisal-scores', authorize('hod', 'dean', 'administrator'), appraisalScores);
router.get('/faculty-overview', authorize('dean', 'administrator'), facultyOverview);

export default router;
