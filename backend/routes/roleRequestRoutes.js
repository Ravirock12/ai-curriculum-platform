import express from 'express';
import {
  submitRoleRequest,
  getMyRoleRequests,
  getAllRoleRequests,
  reviewRoleRequest
} from '../controllers/roleRequestController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

// Student: submit a role upgrade request
// POST /api/role-requests
router.post('/', protect, submitRoleRequest);

// Student: view their own request history
// GET /api/role-requests/my
router.get('/my', protect, getMyRoleRequests);

// Admin: view all requests (optionally filter by ?status=pending)
// GET /api/role-requests
router.get('/', protect, adminOnly, getAllRoleRequests);

// Admin: approve or reject a request
// PATCH /api/role-requests/:id/review
router.patch('/:id/review', protect, adminOnly, reviewRoleRequest);

export default router;
