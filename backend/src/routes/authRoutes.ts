import express from 'express';
import { register, login, logout, getMe, refreshToken, submitContactInquiry, updateEmailPreferences } from '../controllers/authController';
import { protect } from '../middlewares/auth';
import { authLimiter } from '../middlewares/rateLimiter';
import { validateRequest } from '../middlewares/validateRequest';
import { registerSchema, loginSchema, refreshTokenSchema } from '../validations/auth.schema';

const router = express.Router();

// Public auth & contact endpoints protected with rate limiter
router.post('/register', authLimiter, validateRequest(registerSchema), register);
router.post('/login', authLimiter, validateRequest(loginSchema), login);
router.post('/inquiry', submitContactInquiry);

// Refresh token endpoints (supports /refresh and legacy /refresh-token)
router.post('/refresh', authLimiter, validateRequest(refreshTokenSchema), refreshToken);
router.post('/refresh-token', authLimiter, validateRequest(refreshTokenSchema), refreshToken);

// Protected routes
router.post('/logout', logout);
router.get('/me', protect, getMe);
router.put('/preferences', protect, updateEmailPreferences);

export default router;
