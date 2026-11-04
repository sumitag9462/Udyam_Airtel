import bcrypt from 'bcryptjs';
import { User, OtpChallenge, RefreshToken, Notification } from '../models/index.js';
import {
  hashValue,
  generateOtp,
  generateRandomToken,
  signAccessToken,
  REFRESH_TOKEN_EXPIRY_DAYS,
} from '../utils/tokens.js';
import AppError from '../utils/AppError.js';
import { maskPhone, phoneLast4 } from '../utils/mask.js';
import logger from '../config/logger.js';

const OTP_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes
const OTP_COOLDOWN_MS = 60 * 1000; // 60 seconds
const MAX_OTP_ATTEMPTS = 3;
const MAX_STAFF_FAILURES = 5;
const STAFF_LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes

/**
 * Request OTP for owner login.
 * Generic response ensures phone numbers cannot be enumerated.
 */
export async function requestOtp(rawPhone) {
  const digits = String(rawPhone).replace(/\D/g, '').slice(-10);
  if (digits.length !== 10) {
    throw new AppError('Invalid mobile number format. Please provide a 10-digit number.', 400, 'BAD_PHONE');
  }

  const pHash = hashValue(digits);

  // Check cooldown
  const activeChallenge = await OtpChallenge.findOne({
    phoneHash: pHash,
    expiresAt: { $gt: new Date() },
  });

  if (activeChallenge) {
    const timeSinceSent = Date.now() - new Date(activeChallenge.sentAt).getTime();
    if (timeSinceSent < OTP_COOLDOWN_MS) {
      const waitSec = Math.ceil((OTP_COOLDOWN_MS - timeSinceSent) / 1000);
      throw new AppError(`Please wait ${waitSec} seconds before requesting a new OTP.`, 429, 'COOLDOWN');
    }
  }

  const otpCode = generateOtp();
  const codeHash = hashValue(otpCode);
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MS);

  await OtpChallenge.findOneAndUpdate(
    { phoneHash: pHash },
    {
      phoneHash: pHash,
      codeHash,
      attempts: 0,
      expiresAt,
      sentAt: new Date(),
    },
    { upsert: true, returnDocument: 'after' },
  );

  // Write to simulated notifications outbox
  const masked = maskPhone(digits);
  await Notification.create({
    channel: 'sms',
    toMasked: masked,
    template: 'login_otp',
    payload: { code: otpCode, expiresMinutes: 5 },
    sentAt: new Date(),
    simulated: true,
  });

  logger.info({ toMasked: masked }, 'Simulated OTP dispatched to notifications outbox');

  return {
    message: 'If the number is valid, an OTP has been sent.',
    cooldownSeconds: 60,
  };
}

/**
 * Verify OTP and issue token pair for owner.
 */
export async function verifyOtp(rawPhone, otpCode) {
  const digits = String(rawPhone).replace(/\D/g, '').slice(-10);
  const pHash = hashValue(digits);

  const challenge = await OtpChallenge.findOne({
    phoneHash: pHash,
    expiresAt: { $gt: new Date() },
  });

  if (!challenge) {
    throw new AppError('OTP expired or not requested. Please request a new code.', 400, 'OTP_EXPIRED');
  }

  if (challenge.attempts >= MAX_OTP_ATTEMPTS) {
    await OtpChallenge.deleteOne({ _id: challenge._id });
    throw new AppError('Too many failed attempts. Please request a new OTP.', 400, 'OTP_MAX_ATTEMPTS');
  }

  const codeHash = hashValue(String(otpCode).trim());
  if (challenge.codeHash !== codeHash) {
    challenge.attempts += 1;
    await challenge.save();
    throw new AppError('Invalid OTP code. Please try again.', 400, 'INVALID_OTP');
  }

  // OTP verified — consume challenge
  await OtpChallenge.deleteOne({ _id: challenge._id });

  // Find or create Owner user
  let user = await User.findOne({ phoneHash: pHash });
  if (!user) {
    user = await User.create({
      role: 'owner',
      phoneHash: pHash,
      phoneLast4: phoneLast4(digits),
      language: 'en',
      lastLoginAt: new Date(),
    });
  } else {
    user.lastLoginAt = new Date();
    await user.save();
  }

  return issueTokenPair(user);
}

/**
 * Staff login with email and password.
 * Includes lockout protection.
 */
export async function staffLogin(email, password) {
  const cleanEmail = String(email).trim().toLowerCase();
  const user = await User.findOne({ email: cleanEmail }).select('+passwordHash');

  if (!user) {
    throw new AppError('Invalid email or password.', 401, 'INVALID_CREDENTIALS');
  }

  // Check lockout
  if (user.lockUntil && user.lockUntil > new Date()) {
    const waitMin = Math.ceil((user.lockUntil.getTime() - Date.now()) / (60 * 1000));
    throw new AppError(`Account locked due to multiple failed attempts. Try again in ${waitMin} minutes.`, 429, 'LOCKED');
  }

  const isMatch = await bcrypt.compare(String(password), user.passwordHash || '');
  if (!isMatch) {
    user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
    if (user.failedLoginAttempts >= MAX_STAFF_FAILURES) {
      user.lockUntil = new Date(Date.now() + STAFF_LOCKOUT_MS);
      user.failedLoginAttempts = 0;
    }
    await user.save();
    throw new AppError('Invalid email or password.', 401, 'INVALID_CREDENTIALS');
  }

  // Reset failed attempts on success
  user.failedLoginAttempts = 0;
  user.lockUntil = undefined;
  user.lastLoginAt = new Date();
  await user.save();

  return issueTokenPair(user);
}

/**
 * Issue new access and refresh token pair with rotation tracking.
 */
export async function issueTokenPair(user, rotatedFromToken = null) {
  const accessToken = signAccessToken(user);

  const rawRefreshToken = generateRandomToken(48);
  const tokenHash = hashValue(rawRefreshToken);
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

  await RefreshToken.create({
    userId: user._id,
    tokenHash,
    rotatedFrom: rotatedFromToken ? hashValue(rotatedFromToken) : undefined,
    expiresAt,
  });

  const csrfToken = generateRandomToken(24);

  return {
    user: {
      id: user._id.toString(),
      role: user.role,
      phoneLast4: user.phoneLast4,
      email: user.email,
      partnerOrg: user.partnerOrg,
      language: user.language,
    },
    tokens: {
      accessToken,
      refreshToken: rawRefreshToken,
      csrfToken,
    },
  };
}

/**
 * Rotate refresh token with reuse detection.
 */
export async function rotateRefreshToken(rawRefreshToken) {
  if (!rawRefreshToken) {
    throw new AppError('Refresh token required.', 401, 'UNAUTHORIZED');
  }

  const incomingHash = hashValue(rawRefreshToken);
  const existing = await RefreshToken.findOne({ tokenHash: incomingHash });

  if (!existing) {
    throw new AppError('Invalid refresh token.', 401, 'INVALID_TOKEN');
  }

  // Reuse detection: if already revoked, revoke all tokens for this user family
  if (existing.revokedAt) {
    logger.warn({ userId: existing.userId }, 'Refresh token reuse detected — revoking all user tokens');
    await RefreshToken.updateMany({ userId: existing.userId }, { revokedAt: new Date() });
    throw new AppError('Session invalidated due to suspicious activity. Please log in again.', 401, 'TOKEN_REUSE');
  }

  if (existing.expiresAt < new Date()) {
    throw new AppError('Refresh token expired. Please log in again.', 401, 'TOKEN_EXPIRED');
  }

  // Revoke current token
  existing.revokedAt = new Date();
  await existing.save();

  const user = await User.findById(existing.userId);
  if (!user) {
    throw new AppError('User not found.', 401, 'USER_NOT_FOUND');
  }

  return issueTokenPair(user, rawRefreshToken);
}

/**
 * Revoke refresh token on logout.
 */
export async function revokeToken(rawRefreshToken) {
  if (!rawRefreshToken) return;
  const tokenHash = hashValue(rawRefreshToken);
  await RefreshToken.updateOne({ tokenHash }, { revokedAt: new Date() });
}
