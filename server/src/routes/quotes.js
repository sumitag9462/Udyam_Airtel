import { Router } from 'express';
import {
  handleCreateQuote,
  handleGetQuote,
  handleUpdateQuoteItems,
  handlePreviewScenario,
  handleAcceptQuote,
  handleExplainRemoval,
} from '../controllers/quoteController.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';

const router = Router();

// All quote operations require authentication
router.use(requireAuth);

router.post('/', requireRole('owner', 'admin'), handleCreateQuote);
router.get('/:id', requireRole('owner', 'advisor', 'partner', 'admin'), handleGetQuote);
router.patch('/:id/items', requireRole('owner', 'admin'), handleUpdateQuoteItems);
router.post('/:id/preview', requireRole('owner', 'admin'), handlePreviewScenario);
router.post('/:id/accept', requireRole('owner', 'admin'), handleAcceptQuote);
router.get('/:id/explain/:productId', requireRole('owner', 'admin'), handleExplainRemoval);

export default router;
