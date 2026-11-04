import { ZodError } from 'zod';
import mongoose from 'mongoose';
import AppError from '../utils/AppError.js';
import logger from '../config/logger.js';

/**
 * Central error-handling middleware.
 * Always returns a consistent JSON envelope with no stack traces exposed.
 */
export default function errorHandler(err, req, res, _next) {
  const requestId = req.id ?? req.headers['x-request-id'] ?? 'unknown';

  if (err instanceof ZodError) {
    const details = err.issues.map((issue) => ({
      path: issue.path.join('.'),
      message: issue.message,
    }));

    logger.warn({ err, requestId }, 'Zod validation error');

    return res.status(400).json({
      ok: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        details,
        requestId,
      },
    });
  }

  if (err instanceof mongoose.Error.ValidationError) {
    const details = Object.entries(err.errors).map(([field, e]) => ({
      path: field,
      message: e.message,
    }));

    logger.warn({ err, requestId }, 'Mongoose validation error');

    return res.status(400).json({
      ok: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Data validation failed',
        details,
        requestId,
      },
    });
  }

  if (err instanceof AppError || err.statusCode || err.status) {
    const statusCode = err.statusCode || err.status || 400;
    const code = err.code || 'REQUEST_FAILED';
    logger.warn({ err, requestId }, err.message);

    return res.status(statusCode).json({
      ok: false,
      error: {
        code,
        message: err.message,
        ...(err.details && { details: err.details }),
        requestId,
      },
    });
  }

  logger.error({ err, requestId }, 'Unhandled server error');

  return res.status(500).json({
    ok: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
      requestId,
    },
  });
}
