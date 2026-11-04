import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import { config } from '../config/env.js';

export const ACCESS_TOKEN_EXPIRY = '15m';
export const REFRESH_TOKEN_EXPIRY_DAYS = 7;

/**
 * Generate an HMAC hash of a string using JWT secret as pepper.
 * @param {string} value
 * @returns {string}
 */
export function hashValue(value) {
  return crypto
    .createHmac('sha256', config.JWT_ACCESS_SECRET)
    .update(String(value).trim())
    .digest('hex');
}

/**
 * Generate a cryptographically random token string.
 * @param {number} [bytes=32]
 * @returns {string}
 */
export function generateRandomToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString('hex');
}

/**
 * Sign an access JWT for a user.
 * @param {object} user
 * @returns {string}
 */
export function signAccessToken(user) {
  return jwt.sign(
    {
      sub: user._id.toString(),
      role: user.role,
      phoneLast4: user.phoneLast4,
      email: user.email,
      partnerOrg: user.partnerOrg,
    },
    config.JWT_ACCESS_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY },
  );
}

/**
 * Verify an access JWT.
 * @param {string} token
 * @returns {object}
 */
export function verifyAccessToken(token) {
  return jwt.verify(token, config.JWT_ACCESS_SECRET);
}

/**
 * Generate a random 6-digit OTP string.
 * @returns {string}
 */
export function generateOtp() {
  const num = crypto.randomInt(100000, 1000000);
  return String(num);
}
