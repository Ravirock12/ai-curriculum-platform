import express from 'express';
import { getAiRecommendation } from '../controllers/aiController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/recommendation', protect, getAiRecommendation);

export default router;
