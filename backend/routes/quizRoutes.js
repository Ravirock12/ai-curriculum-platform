import express from 'express';
import {
  getQuizzesByTopic,
  submitQuiz,
  getStudentAnalytics,
  getClassAnalytics,
  getBranchStudents,
  getBranchSummary,
  seedQuizzes,
  getCompetitionQuiz,
  getLeaderboard,
  getQuizSchedule
} from '../controllers/quizController.js';
import { protect, teacherOrAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/topic/:topicId',  protect, getQuizzesByTopic);
router.get('/competition',     protect, getCompetitionQuiz);
router.get('/schedule',        protect, getQuizSchedule);
router.get('/leaderboard',     protect, getLeaderboard);
router.post('/submit',         protect, submitQuiz);
router.get('/analytics/student', protect, getStudentAnalytics);
router.get('/analytics/class',   protect, teacherOrAdmin, getClassAnalytics);
router.get('/branch/students', protect, teacherOrAdmin, getBranchStudents);
router.get('/branch/summary', protect, teacherOrAdmin, getBranchSummary);
router.post('/seed',             protect, teacherOrAdmin, seedQuizzes);

export default router;
