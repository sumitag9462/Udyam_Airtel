/**
 * Custom application error with HTTP status code and machine-readable code.
 */
export default class AppError extends Error {
  /**
   * @param {string} message   - Human-readable error description.
   * @param {number} statusCode - HTTP status code (e.g. 400, 404, 409).
   * @param {string} code      - Machine-readable error code (e.g. 'VALIDATION_ERROR').
   * @param {*}      [details] - Optional structured details (field errors, etc.).
   */
  constructor(message, statusCode, code, details = undefined) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}
