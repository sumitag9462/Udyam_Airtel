import rateLimit from 'express-rate-limit';

const isTest = process.env.NODE_ENV === 'test';

export const otpLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => isTest && !req.headers['x-test-rate-limit'],
  validate: { default: false },
  message: {
    ok: false,
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many OTP requests for this number. Please try again in an hour.',
    },
  },
  keyGenerator: (req) => {
    const raw = req.body?.phone || req.ip;
    return String(raw).replace(/\D/g, '').slice(-10) || req.ip;
  },
});

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => isTest && !req.headers['x-test-rate-limit'],
  message: {
    ok: false,
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many login attempts. Please try again later.',
    },
  },
});

export const lookupLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => isTest && !req.headers['x-test-rate-limit'],
  validate: { default: false },
  message: {
    ok: false,
    error: {
      code: 'RATE_LIMITED',
      message: 'Registry lookup limit reached (max 20 per hour).',
    },
  },
  keyGenerator: (req) => req.user?._id?.toString() || req.ip,
});

export const advisorLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => isTest && !req.headers['x-test-rate-limit'],
  validate: { default: false },
  message: {
    ok: false,
    error: {
      code: 'RATE_LIMITED',
      message: 'Advisor message limit reached (max 60 per hour).',
    },
  },
  keyGenerator: (req) => req.user?._id?.toString() || req.ip,
});
