import { verifyAccessToken } from '../utils/tokens.js';
import AppError from '../utils/AppError.js';
import { User } from '../models/index.js';

/**
 * Authentication middleware.
 * Reads token from httpOnly cookie 'access_token' or 'Authorization: Bearer <token>'.
 */
export async function requireAuth(req, _res, next) {
  try {
    let token = req.cookies?.access_token;

    if (!token && req.headers.authorization) {
      const parts = req.headers.authorization.split(' ');
      if (parts.length === 2 && parts[0] === 'Bearer') {
        token = parts[1];
      }
    }

    if (!token) {
      return next(new AppError('Authentication required.', 401, 'UNAUTHORIZED'));
    }

    const payload = verifyAccessToken(token);

    const user = await User.findById(payload.sub);
    if (!user) {
      return next(new AppError('User account not found.', 401, 'USER_NOT_FOUND'));
    }

    req.user = user;
    req.tokenPayload = payload;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return next(new AppError('Session expired. Please refresh token or log in again.', 401, 'TOKEN_EXPIRED'));
    }
    return next(new AppError('Invalid authentication token.', 401, 'INVALID_TOKEN'));
  }
}

/**
 * Optional authentication middleware.
 * Attaches user to req if valid token is present, but does not block if absent.
 */
export async function optionalAuth(req, _res, next) {
  try {
    const token = req.cookies?.access_token || req.headers.authorization?.split(' ')[1];
    if (token) {
      const payload = verifyAccessToken(token);
      const user = await User.findById(payload.sub);
      if (user) {
        req.user = user;
        req.tokenPayload = payload;
      }
    }
  } catch {
    // Ignore invalid tokens for optional auth
  }
  next();
}
