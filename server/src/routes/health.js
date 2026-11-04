import { Router } from 'express';
import mongoose from 'mongoose';

const router = Router();

router.get('/healthz', (_req, res) => {
  res.status(200).json({
    ok: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
    },
  });
});

router.get('/readyz', (_req, res) => {
  const state = mongoose.connection.readyState;
  const isConnected = state === 1; /* 1 = connected */

  const statusCode = isConnected ? 200 : 503;

  res.status(statusCode).json({
    ok: isConnected,
    data: {
      status: isConnected ? 'ready' : 'not_ready',
      database: isConnected ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString(),
    },
  });
});

export default router;
