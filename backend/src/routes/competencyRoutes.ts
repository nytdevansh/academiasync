import express from 'express';
import { getSkillAreas, createSkillArea, updateSkillArea, getMyCompetency, updateMyCompetency, getDepartmentCompetency, getGapAnalysis, assessCompetency, getAssessmentHistory } from '../controllers/competencyController';
import { protect } from '../middlewares/auth';
import { authorize } from '../middlewares/rbac';

const router = express.Router();
router.use(protect);

router.get('/skill-areas', getSkillAreas);
router.post('/skill-areas', authorize('administrator'), createSkillArea);
router.put('/skill-areas/:id', authorize('administrator'), updateSkillArea);

router.get('/me', getMyCompetency);
router.put('/me', authorize('faculty_member', 'hod'), updateMyCompetency);
router.get('/department/:deptId', authorize('hod', 'dean', 'administrator'), getDepartmentCompetency);
router.get('/gap-analysis/:deptId', authorize('hod', 'dean', 'administrator'), getGapAnalysis);
router.put('/:id/assess', authorize('hod', 'administrator'), assessCompetency);
router.get('/:id/history', getAssessmentHistory);

export default router;
