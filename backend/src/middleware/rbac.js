import AppError from '../utils/AppError.js';

/**
 * Role-Based Access Control (RBAC) middleware.
 * Ensures the authenticated user has one of the allowed roles.
 * @param  {...string} allowedRoles
 */
export function requireRole(...allowedRoles) {
  return function rbacMiddleware(req, _res, next) {
    if (!req.user) {
      return next(new AppError('Authentication required.', 401, 'UNAUTHORIZED'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new AppError(
          `Forbidden: Role '${req.user.role}' is not authorized to access this resource.`,
          403,
          'FORBIDDEN',
        ),
      );
    }

    next();
  };
}
