import { z } from 'zod';
import {
  requestOtp,
  verifyOtp,
  staffLogin,
  rotateRefreshToken,
  revokeToken,
} from '../services/authService.js';
import { Conversation, Lead } from '../models/index.js';
import { config } from '../config/env.js';

const isProduction = config.NODE_ENV === 'production';

/**
 * Set authentication cookies on response.
 */
function setAuthCookies(res, tokens) {
  const { accessToken, refreshToken, csrfToken } = tokens;

  res.cookie('access_token', accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    maxAge: 15 * 60 * 1000, // 15 mins
    path: '/',
  });

  res.cookie('refresh_token', refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/',
  });

  res.cookie('csrf_token', csrfToken, {
    httpOnly: false, // Accessible by client JS to set X-CSRF-Token header
    secure: isProduction,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  });
}

/**
 * Clear authentication cookies on response.
 */
function clearAuthCookies(res) {
  res.clearCookie('access_token', { path: '/' });
  res.clearCookie('refresh_token', { path: '/' });
  res.clearCookie('csrf_token', { path: '/' });
}

const otpRequestSchema = z.object({
  phone: z.string().min(10, 'Valid 10-digit mobile number required'),
});

export async function handleOtpRequest(req, res, next) {
  try {
    const { phone } = otpRequestSchema.parse(req.body);
    const result = await requestOtp(phone);
    res.status(200).json({ ok: true, data: result });
  } catch (err) {
    next(err);
  }
}

const otpVerifySchema = z.object({
  phone: z.string().min(10),
  code: z.string().length(6, 'OTP must be 6 digits'),
  conversationId: z.string().optional(),
  sessionSecret: z.string().optional(),
});

export async function handleOtpVerify(req, res, next) {
  try {
    const { phone, code, conversationId, sessionSecret } = otpVerifySchema.parse(req.body);
    const result = await verifyOtp(phone, code);

    // If an active anonymous advisor session was passed, securely claim it for this user
    if (conversationId) {
      try {
        const conv = await Conversation.findById(conversationId);
        if (conv && (!conv.userId || conv.userId.toString() === result.user._id.toString())) {
          if (!conv.sessionSecret || (sessionSecret && sessionSecret === conv.sessionSecret)) {
            conv.userId = result.user._id;
            await conv.save();
            if (conv.leadId) {
              await Lead.findByIdAndUpdate(conv.leadId, { ownerUserId: result.user._id });
            }
          }
        }
      } catch {
        // Non-blocking for login flow
      }
    }

    setAuthCookies(res, result.tokens);
    res.status(200).json({
      ok: true,
      data: {
        user: result.user,
        csrfToken: result.tokens.csrfToken,
        // Also provide token for programmatic / testing clients
        accessToken: result.tokens.accessToken,
      },
    });
  } catch (err) {
    next(err);
  }
}

const staffLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, 'Password required'),
});

export async function handleStaffLogin(req, res, next) {
  try {
    const { email, password } = staffLoginSchema.parse(req.body);
    const result = await staffLogin(email, password);
    setAuthCookies(res, result.tokens);
    res.status(200).json({
      ok: true,
      data: {
        user: result.user,
        csrfToken: result.tokens.csrfToken,
        accessToken: result.tokens.accessToken,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function handleRefresh(req, res, next) {
  try {
    const refreshToken = req.cookies?.refresh_token || req.body?.refreshToken;
    const result = await rotateRefreshToken(refreshToken);
    setAuthCookies(res, result.tokens);
    res.status(200).json({
      ok: true,
      data: {
        user: result.user,
        csrfToken: result.tokens.csrfToken,
        accessToken: result.tokens.accessToken,
      },
    });
  } catch (err) {
    clearAuthCookies(res);
    next(err);
  }
}

export async function handleLogout(req, res, next) {
  try {
    const refreshToken = req.cookies?.refresh_token || req.body?.refreshToken;
    if (refreshToken) {
      await revokeToken(refreshToken);
    }
    clearAuthCookies(res);
    res.status(200).json({ ok: true, data: { message: 'Logged out successfully.' } });
  } catch (err) {
    next(err);
  }
}

export async function handleGetMe(req, res) {
  res.status(200).json({
    ok: true,
    data: {
      user: {
        id: req.user._id.toString(),
        role: req.user.role,
        phoneLast4: req.user.phoneLast4,
        email: req.user.email,
        partnerOrg: req.user.partnerOrg,
        language: req.user.language,
      },
    },
  });
}
