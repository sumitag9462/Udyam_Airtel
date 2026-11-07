import request from 'supertest';
import mongoose from 'mongoose';
import app from '../../src/app.js';
import { config } from '../../src/config/env.js';
import { User, Quote } from '../../src/models/index.js';
import { signAccessToken } from '../../src/utils/tokens.js';

describe('Phase 3: RBAC Authorization Matrix & IDOR Prevention', () => {
  let ownerA;
  let ownerB;
  let advisor;
  let partner;
  let admin;

  let tokenOwnerA;
  let tokenOwnerB;
  let tokenAdvisor;
  let tokenPartner;
  let tokenAdmin;

  let quoteOwnerA;

  beforeAll(async () => {
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(config.MONGO_URI);
    }

    // Clean up any stale matrix test users from prior interrupted runs
    await User.deleteMany({
      $or: [
        { phoneHash: { $in: ['matrix_hash_owner_a', 'matrix_hash_owner_b'] } },
        { email: { $in: ['advisor-matrix@airtel.com', 'partner-matrix@airtel.com', 'admin-matrix@airtel.com'] } },
      ],
    });

    // Create distinct test users
    ownerA = await User.create({
      role: 'owner',
      phoneHash: 'matrix_hash_owner_a',
      phoneLast4: '1111',
      language: 'en',
    });
    ownerB = await User.create({
      role: 'owner',
      phoneHash: 'matrix_hash_owner_b',
      phoneLast4: '2222',
      language: 'en',
    });
    advisor = await User.create({
      role: 'advisor',
      email: 'advisor-matrix@airtel.com',
      language: 'en',
    });
    partner = await User.create({
      role: 'partner',
      email: 'partner-matrix@airtel.com',
      partnerOrg: 'Matrix Partner',
      language: 'en',
    });
    admin = await User.create({
      role: 'admin',
      email: 'admin-matrix@airtel.com',
      language: 'en',
    });

    tokenOwnerA = signAccessToken(ownerA);
    tokenOwnerB = signAccessToken(ownerB);
    tokenAdvisor = signAccessToken(advisor);
    tokenPartner = signAccessToken(partner);
    tokenAdmin = signAccessToken(admin);
  });

  afterAll(async () => {
    await User.deleteMany({
      _id: { $in: [ownerA._id, ownerB._id, advisor._id, partner._id, admin._id] },
    });
    await Quote.deleteMany({
      userId: { $in: [ownerA._id, ownerB._id, admin._id] },
    });
  });

  const sampleProfile = {
    businessType: 'CA / Law office',
    segment: 'prof',
    employeeCount: 5,
    numSites: 1,
    cityTier: 1,
    hasGstin: true,
  };

  describe('Quote Creation (POST /api/v1/quotes)', () => {
    it('allows owner to create a quote', async () => {
      const res = await request(app)
        .post('/api/v1/quotes')
        .set('Authorization', `Bearer ${tokenOwnerA}`)
        .send({
          tierLabel: 'starter',
          profile: sampleProfile,
        });

      expect(res.status).toBe(201);
      expect(res.body.ok).toBe(true);
      expect(res.body.data.quote).toBeDefined();
      quoteOwnerA = res.body.data.quote;
    });

    it('allows admin to create a quote', async () => {
      const res = await request(app)
        .post('/api/v1/quotes')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({
          tierLabel: 'starter',
          profile: sampleProfile,
        });

      expect(res.status).toBe(201);
    });

    it('forbids advisor from directly creating a quote', async () => {
      const res = await request(app)
        .post('/api/v1/quotes')
        .set('Authorization', `Bearer ${tokenAdvisor}`)
        .send({
          tierLabel: 'starter',
          profile: sampleProfile,
        });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('forbids partner from directly creating a quote', async () => {
      const res = await request(app)
        .post('/api/v1/quotes')
        .set('Authorization', `Bearer ${tokenPartner}`)
        .send({
          tierLabel: 'starter',
          profile: sampleProfile,
        });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });
  });

  describe('Quote Inspection (GET /api/v1/quotes/:id) & IDOR Protection', () => {
    it('allows quote owner to fetch their own quote', async () => {
      const res = await request(app)
        .get(`/api/v1/quotes/${quoteOwnerA.quoteId}`)
        .set('Authorization', `Bearer ${tokenOwnerA}`);

      expect(res.status).toBe(200);
      expect(res.body.data.quote.quoteId).toBe(quoteOwnerA.quoteId);
    });

    it('rejects cross-owner inspection (IDOR) with 403 Forbidden', async () => {
      // Owner B attempts to view Owner A's quote
      const res = await request(app)
        .get(`/api/v1/quotes/${quoteOwnerA.quoteId}`)
        .set('Authorization', `Bearer ${tokenOwnerB}`);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('allows advisor to view quotes for assistance', async () => {
      const res = await request(app)
        .get(`/api/v1/quotes/${quoteOwnerA.quoteId}`)
        .set('Authorization', `Bearer ${tokenAdvisor}`);

      expect(res.status).toBe(200);
    });

    it('allows partner to view quotes for channel assistance', async () => {
      const res = await request(app)
        .get(`/api/v1/quotes/${quoteOwnerA.quoteId}`)
        .set('Authorization', `Bearer ${tokenPartner}`);

      expect(res.status).toBe(200);
    });

    it('allows admin to view quotes', async () => {
      const res = await request(app)
        .get(`/api/v1/quotes/${quoteOwnerA.quoteId}`)
        .set('Authorization', `Bearer ${tokenAdmin}`);

      expect(res.status).toBe(200);
    });
  });

  describe('Quote Update (PATCH /api/v1/quotes/:id/items) & IDOR Protection', () => {
    it('allows owner to modify their own quote items', async () => {
      const res = await request(app)
        .patch(`/api/v1/quotes/${quoteOwnerA.quoteId}/items`)
        .set('Authorization', `Bearer ${tokenOwnerA}`)
        .send({
          lineItems: [
            { productId: 'P01', qty: 1 },
            { productId: 'P16', qty: 5 },
          ],
        });

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
    });

    it('rejects cross-owner quote tampering (IDOR) with 403 Forbidden', async () => {
      // Owner B attempts to modify Owner A's quote
      const res = await request(app)
        .patch(`/api/v1/quotes/${quoteOwnerA.quoteId}/items`)
        .set('Authorization', `Bearer ${tokenOwnerB}`)
        .send({
          lineItems: [{ productId: 'P01', qty: 1 }],
        });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('forbids advisor from modifying quote items directly', async () => {
      const res = await request(app)
        .patch(`/api/v1/quotes/${quoteOwnerA.quoteId}/items`)
        .set('Authorization', `Bearer ${tokenAdvisor}`)
        .send({
          lineItems: [{ productId: 'P01', qty: 1 }],
        });

      expect(res.status).toBe(403);
    });

    it('forbids partner from modifying quote items directly', async () => {
      const res = await request(app)
        .patch(`/api/v1/quotes/${quoteOwnerA.quoteId}/items`)
        .set('Authorization', `Bearer ${tokenPartner}`)
        .send({
          lineItems: [{ productId: 'P01', qty: 1 }],
        });

      expect(res.status).toBe(403);
    });
  });

  describe('Quote Acceptance (POST /api/v1/quotes/:id/accept)', () => {
    it('rejects cross-owner quote acceptance with 403 Forbidden', async () => {
      const res = await request(app)
        .post(`/api/v1/quotes/${quoteOwnerA.quoteId}/accept`)
        .set('Authorization', `Bearer ${tokenOwnerB}`)
        .set('Idempotency-Key', 'key-idor-test-1')
        .send();

      expect(res.status).toBe(403);
    });

    it('forbids advisor from accepting quote', async () => {
      const res = await request(app)
        .post(`/api/v1/quotes/${quoteOwnerA.quoteId}/accept`)
        .set('Authorization', `Bearer ${tokenAdvisor}`)
        .set('Idempotency-Key', 'key-advisor-test-1')
        .send();

      expect(res.status).toBe(403);
    });

    it('allows quote owner to accept their own quote', async () => {
      const res = await request(app)
        .post(`/api/v1/quotes/${quoteOwnerA.quoteId}/accept`)
        .set('Authorization', `Bearer ${tokenOwnerA}`)
        .set('Idempotency-Key', 'key-owner-accept-1')
        .send();

      expect(res.status).toBe(200);
      expect(res.body.data.quote.status).toBe('accepted');
    });
  });
});
