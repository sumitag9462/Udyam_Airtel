import { Router } from 'express';
import {
  handleOtpRequest,
  handleOtpVerify,
  handleStaffLogin,
  handleRefresh,
  handleLogout,
  handleGetMe,
} from '../controllers/authController.js';
import { requireAuth } from '../middleware/auth.js';
import { otpLimiter, loginLimiter } from '../middleware/rateLimiters.js';

const router = Router();

router.post('/otp/request', otpLimiter, handleOtpRequest);
router.post('/otp/verify', handleOtpVerify);
router.post('/staff/login', loginLimiter, handleStaffLogin);
router.post('/refresh', handleRefresh);
router.post('/logout', handleLogout);
router.get('/me', requireAuth, handleGetMe);

export default router;
