import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getOverview, exportData, requestDeletion } from '../controllers/meController.js';

const router = express.Router();

// All /me endpoints require authentication
router.use(requireAuth);

router.get('/overview', getOverview);
router.get('/export', exportData);
router.post('/deletion-requests', requestDeletion);

export default router;
