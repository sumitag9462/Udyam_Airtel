import { Router } from 'express';
import { handleAdvisorChat, handleGetConversation } from '../controllers/advisorController.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { advisorLimiter } from '../middleware/rateLimiters.js';

const router = Router();

router.use(requireAuth);

router.post('/chat', advisorLimiter, requireRole('owner', 'advisor', 'admin'), handleAdvisorChat);
router.get('/conversations/:id', requireRole('owner', 'advisor', 'admin'), handleGetConversation);

export default router;
