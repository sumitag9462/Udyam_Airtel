import expressMongoSanitize from 'express-mongo-sanitize';

/**
 * Custom middleware factory around express-mongo-sanitize that sanitizes
 * req.body, req.params, and req.query in place without triggering
 * getter-only reassignment errors.
 */
export default function mongoSanitize() {
  return function sanitizeMiddleware(req, _res, next) {
    if (req.body && typeof req.body === 'object') {
      expressMongoSanitize.sanitize(req.body);
    }
    if (req.params && typeof req.params === 'object') {
      expressMongoSanitize.sanitize(req.params);
    }
    if (req.query && typeof req.query === 'object') {
      expressMongoSanitize.sanitize(req.query);
    }
    next();
  };
}
