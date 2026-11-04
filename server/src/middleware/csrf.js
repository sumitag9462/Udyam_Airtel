import AppError from '../utils/AppError.js';

/**
 * Double-submit cookie CSRF protection middleware for mutating requests.
 * Checks when request is using cookies for auth.
 */
export function verifyCsrf(req, _res, next) {
  // Only check mutating requests
  const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
  if (safeMethods.includes(req.method)) {
    return next();
  }

  // If request uses Bearer token in header, CSRF does not apply (non-browser or programmatic API)
  if (req.headers.authorization?.startsWith('Bearer ')) {
    return next();
  }

  // If request does not carry session cookie, CSRF is not applicable
  if (!req.cookies?.access_token) {
    return next();
  }

  // Skip CSRF check for public auth endpoints (requesting OTP, logging in, logging out)
  const isAuthLoginRoute =
    req.path.startsWith('/auth/otp/request') ||
    req.path.startsWith('/auth/otp/verify') ||
    req.path.startsWith('/auth/staff/login') ||
    req.path.startsWith('/auth/refresh') ||
    req.path.startsWith('/auth/logout');

  if (isAuthLoginRoute) {
    return next();
  }

  const cookieCsrf = req.cookies?.csrf_token;
  const headerCsrf = req.headers['x-csrf-token'];

  if (!cookieCsrf || !headerCsrf || cookieCsrf !== headerCsrf) {
    return next(
      new AppError('CSRF verification failed. Missing or mismatched CSRF token.', 403, 'CSRF_FAILED'),
    );
  }

  next();
}
