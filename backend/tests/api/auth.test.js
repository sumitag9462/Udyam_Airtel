import request from 'supertest';
import mongoose from 'mongoose';
import app from '../../src/app.js';
import { config } from '../../src/config/env.js';
import { User, OtpChallenge, Notification } from '../../src/models/index.js';

describe('Phase 3: Auth API Suite', () => {
  beforeAll(async () => {
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(config.MONGO_URI);
    }
  });

  afterAll(async () => {
    // Keep connection open for subsequent suites when running in band
  });

  beforeEach(async () => {
    // Clean up test-specific OTPs and challenges
    await OtpChallenge.deleteMany({});
  });

  describe('POST /api/v1/auth/otp/request', () => {
    it('returns generic success and writes simulated notification for valid phone', async () => {
      const phone = '9876500001';
      const res = await request(app)
        .post('/api/v1/auth/otp/request')
        .send({ phone });

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.data.message).toBe('If the number is valid, an OTP has been sent.');
      expect(res.body.data.cooldownSeconds).toBe(60);

      // Verify simulated notification in outbox
      const notif = await Notification.findOne({ template: 'login_otp' }).sort({ sentAt: -1 });
      expect(notif).toBeDefined();
      expect(notif.toMasked).toContain('0001');
      expect(notif.payload.code).toMatch(/^[0-9]{6}$/);
      expect(notif.simulated).toBe(true);
    });

    it('rejects invalid phone format with 400', async () => {
      const res = await request(app)
        .post('/api/v1/auth/otp/request')
        .send({ phone: '123' });

      expect(res.status).toBe(400);
      expect(res.body.ok).toBe(false);
    });

    it('enforces 60-second cooldown on consecutive requests', async () => {
      const phone = '9876500002';
      const res1 = await request(app)
        .post('/api/v1/auth/otp/request')
        .send({ phone });
      expect(res1.status).toBe(200);

      const res2 = await request(app)
        .post('/api/v1/auth/otp/request')
        .send({ phone });
      expect(res2.status).toBe(429);
      expect(res2.body.error.code).toBe('COOLDOWN');
    });
  });

  describe('POST /api/v1/auth/otp/verify', () => {
    it('verifies valid OTP, sets auth cookies, and provisions owner user', async () => {
      const phone = '9876500003';
      await request(app)
        .post('/api/v1/auth/otp/request')
        .send({ phone });

      const notif = await Notification.findOne({ template: 'login_otp' }).sort({ sentAt: -1 });
      const otpCode = notif.payload.code;

      const res = await request(app)
        .post('/api/v1/auth/otp/verify')
        .send({ phone, code: otpCode });

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.data.user.role).toBe('owner');
      expect(res.body.data.user.phoneLast4).toBe('0003');
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.csrfToken).toBeDefined();

      // Check cookies
      const cookies = res.headers['set-cookie'];
      expect(cookies.some((c) => c.includes('access_token='))).toBe(true);
      expect(cookies.some((c) => c.includes('refresh_token='))).toBe(true);
      expect(cookies.some((c) => c.includes('csrf_token='))).toBe(true);
    });

    it('rejects incorrect OTP and counts attempts up to limit of 3', async () => {
      const phone = '9876500004';
      await request(app)
        .post('/api/v1/auth/otp/request')
        .send({ phone });

      // Attempt 1: wrong
      const res1 = await request(app)
        .post('/api/v1/auth/otp/verify')
        .send({ phone, code: '000000' });
      expect(res1.status).toBe(400);
      expect(res1.body.error.code).toBe('INVALID_OTP');

      // Attempt 2: wrong
      const res2 = await request(app)
        .post('/api/v1/auth/otp/verify')
        .send({ phone, code: '000001' });
      expect(res2.status).toBe(400);
      expect(res2.body.error.code).toBe('INVALID_OTP');

      // Attempt 3: wrong
      const res3 = await request(app)
        .post('/api/v1/auth/otp/verify')
        .send({ phone, code: '000002' });
      expect(res3.status).toBe(400);

      // Attempt 4: challenge already deleted / locked
      const res4 = await request(app)
        .post('/api/v1/auth/otp/verify')
        .send({ phone, code: '000003' });
      expect(res4.status).toBe(400);
      expect(['OTP_EXPIRED', 'OTP_MAX_ATTEMPTS']).toContain(res4.body.error.code);
    });
  });

  describe('POST /api/v1/auth/staff/login', () => {
    it('authenticates seeded admin user with correct credentials', async () => {
      const res = await request(app)
        .post('/api/v1/auth/staff/login')
        .send({
          email: 'admin@airtel.com',
          password: 'DemoPassword123!',
        });

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.data.user.role).toBe('admin');
      expect(res.body.data.user.email).toBe('admin@airtel.com');
    });

    it('rejects incorrect password with 401', async () => {
      const res = await request(app)
        .post('/api/v1/auth/staff/login')
        .send({
          email: 'admin@airtel.com',
          password: 'WrongPassword!',
        });

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
    });

    it('locks staff account after 5 consecutive failed attempts', async () => {
      const testEmail = 'staff-lockout-test@airtel.com';
      await User.create({
        role: 'advisor',
        email: testEmail,
        passwordHash: '$2a$12$e80yqZvh9vE7N1E4L4H49uC27R4gXb4J8a8n3g/bL.3H6uW.1bF8e', // 'password'
        language: 'en',
      });

      for (let i = 0; i < 4; i++) {
        const res = await request(app)
          .post('/api/v1/auth/staff/login')
          .send({ email: testEmail, password: 'wrong' });
        expect(res.status).toBe(401);
      }

      // 5th attempt triggers lockout
      const res5 = await request(app)
        .post('/api/v1/auth/staff/login')
        .send({ email: testEmail, password: 'wrong' });
      expect(res5.status).toBe(401);

      // 6th attempt returns 429 LOCKED
      const res6 = await request(app)
        .post('/api/v1/auth/staff/login')
        .send({ email: testEmail, password: 'wrong' });
      expect(res6.status).toBe(429);
      expect(res6.body.error.code).toBe('LOCKED');

      await User.deleteOne({ email: testEmail });
    });
  });

  describe('Refresh Token Rotation & Reuse Detection', () => {
    it('rotates refresh token and invalidates old one; detects token reuse', async () => {
      // 1. Log in as admin to get tokens
      const loginRes = await request(app)
        .post('/api/v1/auth/staff/login')
        .send({
          email: 'admin@airtel.com',
          password: 'DemoPassword123!',
        });
      expect(loginRes.status).toBe(200);

      const refreshCookie = loginRes.headers['set-cookie']
        .find((c) => c.startsWith('refresh_token='))
        .split(';')[0];
      const rawRefreshToken = refreshCookie.split('=')[1];

      // 2. Rotate token
      const rotateRes = await request(app)
        .post('/api/v1/auth/refresh')
        .set('Cookie', [refreshCookie]);

      expect(rotateRes.status).toBe(200);
      expect(rotateRes.body.ok).toBe(true);
      expect(rotateRes.body.data.accessToken).toBeDefined();

      // 3. Attempt to reuse old rotated token -> should trigger reuse detection and return 401
      const reuseRes = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: rawRefreshToken });

      expect(reuseRes.status).toBe(401);
      expect(reuseRes.body.error.code).toBe('TOKEN_REUSE');
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    it('clears cookies and revokes refresh token', async () => {
      const loginRes = await request(app)
        .post('/api/v1/auth/staff/login')
        .send({
          email: 'admin@airtel.com',
          password: 'DemoPassword123!',
        });
      const refreshCookie = loginRes.headers['set-cookie'].find((c) => c.startsWith('refresh_token='));

      const logoutRes = await request(app)
        .post('/api/v1/auth/logout')
        .set('Cookie', [refreshCookie]);

      expect(logoutRes.status).toBe(200);
      expect(logoutRes.body.ok).toBe(true);

      const cookies = logoutRes.headers['set-cookie'];
      expect(cookies.some((c) => c.includes('access_token=;') || c.includes('Max-Age=0'))).toBe(true);
    });
  });

  describe('GET /api/v1/auth/me', () => {
    it('returns 401 when no token is provided', async () => {
      const res = await request(app).get('/api/v1/auth/me');
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('returns user details when Bearer token is provided', async () => {
      const loginRes = await request(app)
        .post('/api/v1/auth/staff/login')
        .send({
          email: 'admin@airtel.com',
          password: 'DemoPassword123!',
        });
      const token = loginRes.body.data.accessToken;

      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.user.email).toBe('admin@airtel.com');
      expect(res.body.data.user.role).toBe('admin');
    });
  });

  describe('GET /api/v1/dev/outbox', () => {
    it('returns notifications in non-production mode', async () => {
      const res = await request(app).get('/api/v1/dev/outbox');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data.notifications)).toBe(true);
    });
  });
});
