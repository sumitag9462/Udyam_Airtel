import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import {
  handleCreateOrder,
  handleGetOrder,
  handleListOrders,
  handleScheduleSlot,
  handleSimulateAdvance,
  handleCreateHelpRequest,
} from '../controllers/orderController.js';

const router = Router();

// All order operations require authentication
router.use(requireAuth);

router.post('/', requireRole('owner', 'admin'), handleCreateOrder);
router.get('/', requireRole('owner', 'advisor', 'partner', 'admin'), handleListOrders);
router.get('/:id', requireRole('owner', 'advisor', 'partner', 'admin'), handleGetOrder);
router.post('/:id/slot', requireRole('owner', 'admin'), handleScheduleSlot);
router.post('/:id/simulate-advance', requireRole('owner', 'advisor', 'admin'), handleSimulateAdvance);
router.post('/:id/help', requireRole('owner', 'admin'), handleCreateHelpRequest);

export default router;
