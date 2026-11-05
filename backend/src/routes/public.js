import express from 'express';
import { optionalAuth } from '../middleware/auth.js';
import { getFaq, createGrievance } from '../controllers/publicController.js';

const router = express.Router();

router.get('/faq', getFaq);
router.post('/grievances', optionalAuth, createGrievance);

export default router;
