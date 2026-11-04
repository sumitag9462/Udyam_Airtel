import { Router } from 'express';
import { Notification } from '../models/index.js';
import { config } from '../config/env.js';

const router = Router();

// Only accessible in non-production
router.get('/outbox', async (_req, res) => {
  if (config.NODE_ENV === 'production') {
    return res.status(404).json({
      ok: false,
      error: { code: 'NOT_FOUND', message: 'Dev outbox is disabled in production.' },
    });
  }

  const notifications = await Notification.find({})
    .sort({ sentAt: -1 })
    .limit(50)
    .lean();

  res.status(200).json({
    ok: true,
    data: { notifications },
  });
});

export default router;
