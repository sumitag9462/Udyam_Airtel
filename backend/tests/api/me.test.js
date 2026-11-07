import request from 'supertest';
import mongoose from 'mongoose';
import app from '../../src/app.js';
import { config } from '../../src/config/env.js';
import { User, Lead, Quote, Consent, DeletionRequest, Grievance } from '../../src/models/index.js';
import { signAccessToken } from '../../src/utils/tokens.js';

describe('Me & DPDP Compliance API Suite', () => {
  let testUser;
  let authToken;

  beforeAll(async () => {
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(config.MONGO_URI);
    }

    testUser = await User.create({
      role: 'owner',
      phoneHash: 'me_test_hash_' + Date.now(),
      phoneLast4: '7788',
      language: 'en',
    });
    authToken = signAccessToken(testUser);

    const lead = await Lead.create({
      leadId: `LD-ME-${Date.now().toString(36)}`,
      origin: 'live',
      ownerUserId: testUser._id,
      businessName: 'Gupta Medicos',
      businessType: 'Pharmacy / Chemist',
      segment: 'micro',
      city: 'Jaipur',
      cityTier: 2,
      state: 'Rajasthan',
      preferredLanguage: 'hi',
      employeeCount: 4,
      numSites: 1,
      hasGstin: true,
      gstin: '08ABCDE1234F1Z5',
      hasUdyam: false,
      leadSource: 'Web',
      stageReached: 'Quote accepted',
      stageOrdinal: 3,
    });

    await Quote.create({
      quoteId: `QT-ME-${Date.now().toString(36).toUpperCase()}`,
      leadId: lead._id,
      userId: testUser._id,
      tierLabel: 'starter',
      lineItems: [
        {
          productId: 'P01',
          name: 'Airtel Office Internet 100 Mbps',
          unit: 'per connection',
          qty: 1,
          unitPrice: 999,
          setupFee: 0,
          lineMonthly: 999,
          lineSetup: 0,
        },
      ],
      monthlyTotal: 999,
      setupTotal: 0,
      contractMonths: 12,
      firstYearTotal: 11988,
      rulesVersion: '1.0.0',
      priceHash: 'test-hash-me',
      profileSnapshot: {
        businessType: 'Pharmacy / Chemist',
        city: 'Jaipur',
        cityTier: 2,
        employeeCount: 4,
        numSites: 1,
        hasGstin: true,
      },
      status: 'accepted',
      acceptedAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 86400 * 1000),
    });

    await Consent.create({
      userId: testUser._id,
      leadId: lead._id,
      noticeVersion: '1.0.0',
      purposes: ['kyc_verification'],
      documentTypes: ['gst_certificate', 'signatory_pan'],
      ipHash: 'test-ip-hash',
      userAgentHash: 'test-ua-hash',
      givenAt: new Date(),
    });
  });

  afterAll(async () => {
    if (testUser) {
      await User.deleteOne({ _id: testUser._id });
      await Lead.deleteMany({ ownerUserId: testUser._id });
      await Quote.deleteMany({ userId: testUser._id });
      await Consent.deleteMany({ userId: testUser._id });
      await DeletionRequest.deleteMany({ userId: testUser._id });
      await Grievance.deleteMany({ userId: testUser._id });
    }
  });

  describe('GET /api/v1/me/overview', () => {
    it('returns 401 when unauthenticated', async () => {
      const res = await request(app).get('/api/v1/me/overview');
      expect(res.status).toBe(401);
    });

    it('returns consolidated profile and next action for authenticated owner', async () => {
      const res = await request(app)
        .get('/api/v1/me/overview')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.data.user.id).toBe(String(testUser._id));
      expect(res.body.data.lead.businessName).toBe('Gupta Medicos');
      expect(res.body.data.latestQuote.tierLabel).toBe('starter');
      expect(res.body.data.nextAction.step).toBe('kyc_verification');
      expect(res.body.data.activeConsentsCount).toBe(1);
    });
  });

  describe('GET /api/v1/me/export (DPDP Data Portability)', () => {
    it('exports complete user bundle in JSON format with DPDP header', async () => {
      const res = await request(app)
        .get('/api/v1/me/export')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.header['content-type']).toMatch(/json/);
      expect(res.body.complianceNotice).toContain('DPDP Act');
      expect(res.body.user.phoneLast4).toBe('7788');
      expect(res.body.leadProfile.businessName).toBe('Gupta Medicos');
      expect(res.body.quotes.length).toBeGreaterThanOrEqual(1);
      expect(res.body.consents.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('POST /api/v1/me/deletion-requests (DPDP Right to Erasure)', () => {
    it('records erasure request and marks active consents as withdrawn', async () => {
      const res = await request(app)
        .post('/api/v1/me/deletion-requests')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ reason: 'Owner closing retail business' });

      expect(res.status).toBe(201);
      expect(res.body.ok).toBe(true);
      expect(res.body.data.status).toBe('pending');

      // Verify active consents are withdrawn
      const activeConsents = await Consent.find({
        userId: testUser._id,
        withdrawnAt: { $exists: false },
      });
      expect(activeConsents.length).toBe(0);
    });
  });

  describe('GET /api/v1/faq', () => {
    it('returns localized FAQ items for English and Hindi', async () => {
      const resEn = await request(app).get('/api/v1/faq?lang=en');
      expect(resEn.status).toBe(200);
      expect(resEn.body.data.language).toBe('en');
      expect(resEn.body.data.categories.length).toBeGreaterThanOrEqual(3);

      const resHi = await request(app).get('/api/v1/faq?lang=hi');
      expect(resHi.status).toBe(200);
      expect(resHi.body.data.language).toBe('hi');
      expect(resHi.body.data.categories[0].categoryName).toContain('उद्यम');
    });
  });

  describe('POST /api/v1/grievances', () => {
    it('allows registering a formal DPDP / service grievance', async () => {
      const res = await request(app)
        .post('/api/v1/grievances')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          category: 'consent_withdrawal',
          details: 'Please confirm all document images are permanently expunged.',
          contactEmail: 'owner@guptamedicos.in',
        });

      expect(res.status).toBe(201);
      expect(res.body.ok).toBe(true);
      expect(res.body.data.ticketId).toMatch(/^GRV-/);
      expect(res.body.data.status).toBe('received');
    });

    it('rejects invalid or too short grievance description', async () => {
      const res = await request(app)
        .post('/api/v1/grievances')
        .send({
          category: 'other',
          details: 'short',
        });

      expect(res.status).toBe(400);
      expect(res.body.ok).toBe(false);
    });
  });
});
