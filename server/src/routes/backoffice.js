import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import {
  getFunnelMetrics,
  getUnclosedLeads,
  getSegmentAnalytics,
  getSourceAnalytics,
  updateLeadStatus,
} from '../controllers/backofficeController.js';

const router = Router();

// All back-office endpoints require staff roles (advisor, partner, admin)
router.use(requireAuth);
router.use(requireRole('advisor', 'partner', 'admin'));

router.get('/funnel', getFunnelMetrics);
router.get('/unclosed-leads', getUnclosedLeads);
router.get('/segments', getSegmentAnalytics);
router.get('/sources', getSourceAnalytics);
router.patch('/leads/:id', updateLeadStatus);

export default router;
