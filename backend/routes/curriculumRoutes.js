import express from 'express';
import { getSubjects, addSubject, updateSubject, deleteSubject, submitSubject, reviewSubject, getTopics, addTopic, addSubjectTopic, updateTopic, deleteTopic, updateTopicRelevance, getTrends, getAnalytics, getRecommendations } from '../controllers/curriculumController.js';
import { protect, teacherOrAdmin, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/subjects')
  .get(protect, getSubjects)
  .post(protect, teacherOrAdmin, addSubject);

router.route('/subjects/:id')
  .put(protect, teacherOrAdmin, updateSubject)
  .delete(protect, teacherOrAdmin, deleteSubject);

router.route('/subjects/:id/submit')
  .put(protect, teacherOrAdmin, submitSubject);

router.route('/subjects/:id/review')
  .put(protect, adminOnly, reviewSubject);

router.route('/subjects/:id/topics')
  .post(protect, teacherOrAdmin, addSubjectTopic);

router.route('/topics')
  .get(getTopics)
  .post(protect, teacherOrAdmin, addTopic);

router.route('/topics/:id')
  .put(protect, teacherOrAdmin, updateTopic)
  .delete(protect, teacherOrAdmin, deleteTopic);

router.route('/topics/:id/relevance')
  .put(protect, teacherOrAdmin, updateTopicRelevance);

router.get('/trends', getTrends);
router.get('/analytics', protect, getAnalytics);
router.get('/recommendations', protect, getRecommendations);

export default router;
