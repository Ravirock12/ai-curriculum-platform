import express from 'express';
import { getAllRoleRequests } from '../controllers/roleRequestController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

// Admin: view all role requests
// GET /api/admin/requests
router.get('/requests', protect, adminOnly, getAllRoleRequests);

export default router;
