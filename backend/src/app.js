import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import mongoSanitize from './middleware/mongoSanitize.js';
import pinoHttp from 'pino-http';
import rateLimit from 'express-rate-limit';
import { config } from './config/env.js';
import logger from './config/logger.js';
import { RATE_LIMITS } from './config/constants.js';
import healthRouter from './routes/health.js';
import authRouter from './routes/auth.js';
import devRouter from './routes/dev.js';
import catalogueRouter from './routes/catalogue.js';
import rulesRouter from './routes/rules.js';
import quotesRouter from './routes/quotes.js';
import advisorRouter from './routes/advisor.js';
import kycRouter from './routes/kyc.js';
import ordersRouter from './routes/orders.js';
import backofficeRouter from './routes/backoffice.js';
import partnerRouter from './routes/partner.js';
import meRouter from './routes/me.js';
import publicRouter from './routes/public.js';
import { verifyCsrf } from './middleware/csrf.js';
import errorHandler from './middleware/errorHandler.js';

const app = express();

/* ── Security headers ──────────────────────────────────────────────── */
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:'],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        frameAncestors: ["'none'"],
        upgradeInsecureRequests: config.NODE_ENV === 'production' ? [] : null,
      },
    },
  })
);

/* ── CORS ──────────────────────────────────────────────────────────── */
app.use(
  cors({
    origin: config.CLIENT_ORIGIN,
    credentials: true,
  })
);

/* ── Body parsing ──────────────────────────────────────────────────── */
app.use(express.json({ limit: '1mb' }));

/* ── Cookies ───────────────────────────────────────────────────────── */
app.use(cookieParser());

/* ── NoSQL injection protection ────────────────────────────────────── */
app.use(mongoSanitize());

/* ── Request logging ───────────────────────────────────────────────── */
app.use(
  pinoHttp({
    logger,
    redact: {
      paths: ['req.headers.authorization', 'req.headers.cookie', 'res.headers["set-cookie"]'],
      censor: '[REDACTED]',
    },
    autoLogging: {
      ignore: (req) => req.url === '/healthz' || req.url === '/readyz',
    },
  })
);

/* ── Global rate limit ─────────────────────────────────────────────── */
app.use(
  rateLimit({
    windowMs: RATE_LIMITS.global.windowMs,
    max: RATE_LIMITS.global.max,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      ok: false,
      error: {
        code: 'RATE_LIMITED',
        message: 'Too many requests, please try again later',
      },
    },
  })
);

/* ── Health routes (outside /api/v1) ───────────────────────────────── */
app.use(healthRouter);

/* ── API v1 router ─────────────────────────────────────────────────── */
const apiV1Router = express.Router();
apiV1Router.use(verifyCsrf);
apiV1Router.use('/auth', authRouter);
apiV1Router.use('/dev', devRouter);
apiV1Router.use('/catalogue', catalogueRouter);
apiV1Router.use('/rules', rulesRouter);
apiV1Router.use('/quotes', quotesRouter);
apiV1Router.use('/advisor', advisorRouter);
apiV1Router.use('/kyc', kycRouter);
apiV1Router.use('/orders', ordersRouter);
apiV1Router.use('/backoffice', backofficeRouter);
apiV1Router.use('/partner', partnerRouter);
apiV1Router.use('/me', meRouter);
apiV1Router.use('/public', publicRouter);
apiV1Router.use('/', publicRouter);

app.use('/api/v1', apiV1Router);

/* ── 404 handler ───────────────────────────────────────────────────── */
app.use((_req, res) => {
  res.status(404).json({
    ok: false,
    error: {
      code: 'NOT_FOUND',
      message: 'The requested resource was not found',
    },
  });
});

/* ── Central error handler ─────────────────────────────────────────── */
app.use(errorHandler);

export default app;
