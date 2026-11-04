import request from 'supertest';
import mongoose from 'mongoose';
import app from '../../src/app.js';
import { config } from '../../src/config/env.js';
import { User, Quote } from '../../src/models/index.js';
import { signAccessToken } from '../../src/utils/tokens.js';

describe('Phase 3: Quotes, Catalogue & Rules API Suite', () => {
  let ownerUser;
  let ownerToken;

  beforeAll(async () => {
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(config.MONGO_URI);
    }

    ownerUser = await User.create({
      role: 'owner',
      phoneHash: 'quotes_test_phone_hash_01',
      phoneLast4: '9999',
      language: 'en',
    });
    ownerToken = signAccessToken(ownerUser);
  });

  afterAll(async () => {
    await User.deleteOne({ _id: ownerUser._id });
    await Quote.deleteMany({ userId: ownerUser._id });
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
    }
  });

  describe('Catalogue Endpoint (GET /api/v1/catalogue)', () => {
    it('returns all 25 active products', async () => {
      const res = await request(app).get('/api/v1/catalogue');
      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.data.products.length).toBe(25);
    });

    it('filters catalogue by category', async () => {
      const res = await request(app).get('/api/v1/catalogue?category=Connectivity');
      expect(res.status).toBe(200);
      expect(res.body.data.products.every((p) => p.category === 'Connectivity')).toBe(true);
      expect(res.body.data.products.length).toBeGreaterThan(0);
    });

    it('filters catalogue by segment and city_tier', async () => {
      const res = await request(app).get('/api/v1/catalogue?segment=micro&city_tier=2');
      expect(res.status).toBe(200);
      expect(
        res.body.data.products.every(
          (p) => p.targetSegments.includes('micro') && p.availableCityTiers.includes(2),
        ),
      ).toBe(true);
    });
  });

  describe('Rules Endpoints (/api/v1/rules)', () => {
    it('POST /rules/bundles computes 3 tiers for a profile', async () => {
      const res = await request(app)
        .post('/api/v1/rules/bundles')
        .send({
          businessType: 'CA / Law office',
          segment: 'prof',
          employeeCount: 5,
          numSites: 1,
          cityTier: 1,
          hasGstin: true,
        });

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.data.tiers.length).toBe(3);
      const labels = res.body.data.tiers.map((t) => t.tierLabel);
      expect(labels).toEqual(['starter', 'standard', 'resilient']);
    });

    it('POST /rules/validate passes valid bundle and catches missing dependencies', async () => {
      // P11 Static IP requires fibre P01|P02|P03
      const failRes = await request(app)
        .post('/api/v1/rules/validate')
        .send({
          profile: { segment: 'prof', employeeCount: 5, numSites: 1, cityTier: 1, hasGstin: true },
          lineItems: [{ productId: 'P11', qty: 1 }],
        });

      expect(failRes.status).toBe(200);
      expect(failRes.body.data.valid).toBe(false);
      expect(failRes.body.data.violations.some((v) => v.code === 'DEPENDENCY_MISSING')).toBe(true);

      const passRes = await request(app)
        .post('/api/v1/rules/validate')
        .send({
          profile: { segment: 'prof', employeeCount: 5, numSites: 1, cityTier: 1, hasGstin: true },
          lineItems: [
            { productId: 'P01', qty: 1 },
            { productId: 'P11', qty: 1 },
          ],
        });

      expect(passRes.status).toBe(200);
      expect(passRes.body.data.valid).toBe(true);
    });
  });

  describe('Quote Lifecycle & Idempotency', () => {
    let createdQuote;

    it('creates draft quote from a tier', async () => {
      const res = await request(app)
        .post('/api/v1/quotes')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          tierLabel: 'starter',
          profile: {
            businessType: 'CA / Law office',
            segment: 'prof',
            employeeCount: 5,
            numSites: 1,
            cityTier: 1,
            hasGstin: true,
          },
        });

      expect(res.status).toBe(201);
      createdQuote = res.body.data.quote;
      expect(createdQuote.status).toBe('draft');
      expect(createdQuote.monthlyTotal).toBe(1624); // P01(999) + P16x5(625)
      expect(createdQuote.setupTotal).toBe(0);
      expect(createdQuote.contractMonths).toBe(12);
      expect(createdQuote.firstYearTotal).toBe(19488);
    });

    it('updates quote add-on items with server re-computing totals', async () => {
      const res = await request(app)
        .patch(`/api/v1/quotes/${createdQuote.quoteId}/items`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          lineItems: [
            { productId: 'P01', qty: 1 }, // 999/mo, 0 setup
            { productId: 'P16', qty: 5 }, // 625/mo
            { productId: 'P11', qty: 1 }, // Static IP: 200/mo
          ],
        });

      expect(res.status).toBe(200);
      expect(res.body.data.quote.monthlyTotal).toBe(999 + 625 + 200); // 1824
      expect(res.body.data.quote.tierLabel).toBe('custom');
    });

    it('explains impact of removing a product from quote', async () => {
      const res = await request(app)
        .get(`/api/v1/quotes/${createdQuote.quoteId}/explain/P01`)
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.explanation).toBeDefined();
      expect(
        res.body.data.explanation.breaksDependencies.some((d) => d.includes('P11')),
      ).toBe(true);
    });

    it('runs Business Preview scenarios (link_failure, budget_cut, second_site)', async () => {
      const preview1 = await request(app)
        .post(`/api/v1/quotes/${createdQuote.quoteId}/preview`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ scenario: 'link_failure' });

      expect(preview1.status).toBe(200);
      expect(preview1.body.data.preview.scenario).toBe('link_failure');
      expect(preview1.body.data.preview.hasProtection).toBeDefined();
      expect(preview1.body.data.preview.summary).toBeDefined();

      const preview2 = await request(app)
        .post(`/api/v1/quotes/${createdQuote.quoteId}/preview`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ scenario: 'budget_cut' });

      expect(preview2.status).toBe(200);
      expect(preview2.body.data.preview.scenario).toBe('budget_cut');
      expect(preview2.body.data.preview.deltaMonthly).toBeDefined();

      const preview3 = await request(app)
        .post(`/api/v1/quotes/${createdQuote.quoteId}/preview`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ scenario: 'second_site' });

      expect(preview3.status).toBe(200);
      expect(preview3.body.data.preview.scenario).toBe('second_site');
      expect(preview3.body.data.preview.newMonthly).toBeGreaterThan(0);
    });

    it('requires Idempotency-Key to accept quote', async () => {
      const res = await request(app)
        .post(`/api/v1/quotes/${createdQuote.quoteId}/accept`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send();

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('IDEMPOTENCY_REQUIRED');
    });

    it('accepts quote with Idempotency-Key and freezes pricing', async () => {
      const idempotencyKey = 'quote-accept-key-12345';
      const res = await request(app)
        .post(`/api/v1/quotes/${createdQuote.quoteId}/accept`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .set('Idempotency-Key', idempotencyKey)
        .send();

      expect(res.status).toBe(200);
      expect(res.body.data.quote.status).toBe('accepted');
      expect(res.body.data.quote.acceptedAt).toBeDefined();

      // Retry with same idempotency key returns same accepted quote
      const retryRes = await request(app)
        .post(`/api/v1/quotes/${createdQuote.quoteId}/accept`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .set('Idempotency-Key', idempotencyKey)
        .send();

      expect(retryRes.status).toBe(200);
      expect(retryRes.body.data.quote.status).toBe('accepted');
    });

    it('enforces quote immutability after acceptance', async () => {
      const res = await request(app)
        .patch(`/api/v1/quotes/${createdQuote.quoteId}/items`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          lineItems: [{ productId: 'P01', qty: 1 }],
        });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('QUOTE_IMMUTABLE');
    });
  });

  describe('Golden Test Cases (Section 9.7 API Integration)', () => {
    it('Golden Case 1: Dental clinic, 14 staff, 1 site, Tier 1, GSTIN Active', async () => {
      const profile = {
        businessType: 'Dental clinic',
        segment: 'prof',
        employeeCount: 14,
        numSites: 1,
        cityTier: 1,
        hasGstin: true,
      };

      const res = await request(app).post('/api/v1/rules/bundles').send(profile);
      expect(res.status).toBe(200);
      const { tiers, shortfall } = res.body.data;
      expect(shortfall).toBeNull();

      const starter = tiers.find((t) => t.tierLabel === 'starter');
      expect(starter.monthlyTotal).toBe(2749); // P01(999) + 14xP16(1750)
      expect(starter.setupTotal).toBe(0);

      const standard = tiers.find((t) => t.tierLabel === 'standard');
      expect(standard.monthlyTotal).toBe(4634);

      const resilient = tiers.find((t) => t.tierLabel === 'resilient');
      expect(resilient.monthlyTotal).toBe(5133);
      expect(resilient.setupTotal).toBe(1500);
      expect(resilient.firstYearTotal).toBe(63096);
    });

    it('Golden Case 2: Kirana store, 1 site, 2 staff, Tier 2, budget ₹1,500', async () => {
      const profile = {
        businessType: 'Kirana store',
        segment: 'micro',
        employeeCount: 2,
        numSites: 1,
        cityTier: 2,
        budgetMonthly: 1500,
        hasGstin: false,
      };

      const res = await request(app).post('/api/v1/rules/bundles').send(profile);
      expect(res.status).toBe(200);
      const { tiers, shortfall } = res.body.data;
      expect(shortfall).toBeNull();

      const starter = tiers.find((t) => t.tierLabel === 'starter');
      expect(starter.monthlyTotal).toBe(1498); // P04(899) + P19(599)
      expect(starter.setupTotal).toBe(2500);
      expect(starter.firstYearTotal).toBe(20476);
    });

    it('Golden Case 3: Restaurant chain, 4 sites, 40 staff, Tier 1, cameras 8', async () => {
      const profile = {
        businessType: 'Restaurant chain',
        segment: 'multi',
        employeeCount: 40,
        numSites: 4,
        cityTier: 1,
        cameras: 8,
        hasGstin: true,
        gstin: { present: true, valid: true, status: 'Active' },
      };

      const res = await request(app).post('/api/v1/rules/bundles').send(profile);
      expect(res.status).toBe(200);
      const { tiers } = res.body.data;

      const resilient = tiers.find((t) => t.tierLabel === 'resilient');
      expect(resilient.indicativeOnly).toBe(true);
      expect(resilient.monthlyTotal).toBe(19584);
      expect(resilient.setupTotal).toBe(40400);
      expect(resilient.contractMonths).toBe(24);
      expect(resilient.firstYearTotal).toBe(275408);
    });
  });
});
