import { Router } from 'express';
import { handleAdvisorChat, handleGetConversation } from '../controllers/advisorController.js';
import { requireAuth, optionalAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { advisorLimiter } from '../middleware/rateLimiters.js';

const router = Router();

// Allow guests or authenticated users to chat with the advisor
router.post('/chat', optionalAuth, advisorLimiter, handleAdvisorChat);

// Conversation retrieval supports authenticated users and guests with matching session secret
router.get('/conversations/:id', optionalAuth, handleGetConversation);

export default router;
