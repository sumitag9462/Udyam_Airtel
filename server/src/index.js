import { config } from './config/env.js';
import logger from './config/logger.js';
import mongoose from 'mongoose';
import app from './app.js';

const MONGO_RETRY_DELAY_MS = 5000;
const MONGO_MAX_RETRIES = 5;
const SHUTDOWN_TIMEOUT_MS = 10_000;

/**
 * Connect to MongoDB with retry logic.
 */
async function connectMongo(retries = MONGO_MAX_RETRIES) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await mongoose.connect(config.MONGO_URI);
      logger.info('MongoDB connected');
      return;
    } catch (err) {
      logger.error({ err, attempt, maxRetries: retries }, 'MongoDB connection failed');

      if (attempt === retries) {
        logger.fatal('Exhausted MongoDB connection retries — exiting');
        process.exit(1);
      }

      await new Promise((resolve) => setTimeout(resolve, MONGO_RETRY_DELAY_MS));
    }
  }
}

/**
 * Start the HTTP server.
 */
async function start() {
  await connectMongo();

  const server = app.listen(config.PORT, () => {
    logger.info({ port: config.PORT }, 'Server listening');
  });

  /* ── Graceful shutdown ─────────────────────────────────────────── */
  let shuttingDown = false;

  async function shutdown(signal) {
    if (shuttingDown) return;
    shuttingDown = true;

    logger.info({ signal }, 'Shutdown signal received — draining connections');

    const forceExit = setTimeout(() => {
      logger.fatal('Graceful shutdown timed out — forcing exit');
      process.exit(1);
    }, SHUTDOWN_TIMEOUT_MS);

    forceExit.unref();

    try {
      await new Promise((resolve, reject) => {
        server.close((err) => (err ? reject(err) : resolve()));
      });
      logger.info('HTTP server closed');

      await mongoose.connection.close();
      logger.info('MongoDB connection closed');

      process.exit(0);
    } catch (err) {
      logger.error({ err }, 'Error during shutdown');
      process.exit(1);
    }
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

/* ── Global safety nets ────────────────────────────────────────────── */
process.on('unhandledRejection', (reason) => {
  logger.fatal({ err: reason }, 'Unhandled promise rejection');
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  logger.fatal({ err }, 'Uncaught exception');
  process.exit(1);
});

start();
