import express from 'express';
import { registerUser, loginUser, getUserProfile, verifyOTP, forgotPassword, resetPassword, resetDemo } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/verify-otp', verifyOTP);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/profile', protect, getUserProfile);
router.post('/reset-demo', resetDemo);

export default router;
