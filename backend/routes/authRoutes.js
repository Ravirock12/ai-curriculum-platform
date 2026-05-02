import express from 'express';
import { registerUser, loginUser, getUserProfile, verifyOTP, forgotPassword, resetPassword, resetDemo, createAdminWithKey, promoteToAdmin } from '../controllers/authController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/verify-otp', verifyOTP);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/profile', protect, getUserProfile);
router.post('/reset-demo', resetDemo);

// Secure Admin Creation Routes
router.post('/admin/register-with-key', createAdminWithKey);
router.patch('/admin/promote/:userId', protect, adminOnly, promoteToAdmin);

export default router;
