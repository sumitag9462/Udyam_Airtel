import request from 'supertest';
import mongoose from 'mongoose';
import app from '../../src/app.js';
import { config } from '../../src/config/env.js';
import { User, Quote, Lead, Order, HelpRequest } from '../../src/models/index.js';
import { signAccessToken } from '../../src/utils/tokens.js';

describe('Phase 6: Orders, Tracker & Provisioning Simulator Suite', () => {
  let ownerUser;
  let ownerToken;
  let secondOwnerUser;
  let secondOwnerToken;
  let advisorUser;
  let advisorToken;

  let testQuote;
  let testLead;

  beforeAll(async () => {
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(config.MONGO_URI);
    }

    ownerUser = await User.create({
      role: 'owner',
      phoneHash: 'order_test_owner_hash_01',
      phoneLast4: '5555',
      language: 'en',
    });
    ownerToken = signAccessToken(ownerUser);

    secondOwnerUser = await User.create({
      role: 'owner',
      phoneHash: 'order_test_second_owner_hash_01',
      phoneLast4: '4444',
      language: 'en',
    });
    secondOwnerToken = signAccessToken(secondOwnerUser);

    advisorUser = await User.create({
      role: 'advisor',
      phoneHash: 'order_test_advisor_hash_01',
      phoneLast4: '3333',
      language: 'en',
    });
    advisorToken = signAccessToken(advisorUser);

    testLead = await Lead.create({
      leadId: `LD-ORD-TEST-${Date.now().toString(36)}`,
      origin: 'live',
      ownerUserId: ownerUser._id,
      businessName: 'Apex Textiles Ltd',
      businessType: 'Manufacturing',
      segment: 'mfg',
      city: 'Delhi',
      cityTier: 1,
      state: 'Delhi',
      preferredLanguage: 'English',
      employeeCount: 15,
      numSites: 1,
      hasGstin: true,
      hasUdyam: false,
      leadSource: 'Website form',
      stageReached: 'quote_accepted',
      stageOrdinal: 3,
    });

    testQuote = await Quote.create({
      quoteId: `QT-ORD-${Date.now().toString(36).toUpperCase()}`,
      userId: ownerUser._id,
      leadId: testLead._id,
      tierLabel: 'standard',
      status: 'accepted',
      rulesVersion: '1.0.0',
      priceHash: 'test-hash-ord-01',
      monthlyTotal: 999,
      setupTotal: 1000,
      firstYearTotal: 999 * 12 + 1000,
      contractMonths: 12,
      profileSnapshot: {
        segment: 'mfg',
        city: 'Delhi',
        cityTier: 1,
        employeeCount: 15,
        numSites: 1,
        hasGstin: true,
      },
      expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000),
      acceptedAt: new Date(),
      lineItems: [
        {
          productId: 'P01',
          name: 'Airtel Business Broadband 200 Mbps',
          unit: 'per connection',
          qty: 1,
          unitPrice: 999,
          setupFee: 1000,
          lineMonthly: 999,
          lineSetup: 1000,
        },
      ],
    });
  });

  afterAll(async () => {
    await User.deleteMany({ _id: { $in: [ownerUser._id, secondOwnerUser._id, advisorUser._id] } });
    await Lead.deleteMany({ _id: testLead._id });
    await Quote.deleteMany({ _id: testQuote._id });
    await Order.deleteMany({ userId: ownerUser._id });
    await HelpRequest.deleteMany({ userId: ownerUser._id });
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
    }
  });

  describe('Order Creation & Idempotency (Non-negotiable Rule 12)', () => {
    const idempotencyKey = `idem-test-order-${Date.now()}`;
    let createdOrder;

    it('creates an order with valid idempotency key', async () => {
      const res = await request(app)
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${ownerToken}`)
        .set('Idempotency-Key', idempotencyKey)
        .send({
          quoteId: testQuote.quoteId,
          leadId: testLead._id.toString(),
        });

      expect(res.status).toBe(201);
      expect(res.body.ok).toBe(true);
      expect(res.body.data.orderId).toBeDefined();
      expect(res.body.data.orderId.startsWith('ORD-')).toBe(true);
      expect(res.body.data.idempotencyKey).toBe(idempotencyKey);
      expect(res.body.data.timeline.length).toBeGreaterThan(0);

      // Verify Rule 14: Never claim guarantees; dates are estimated
      expect(res.body.data.estimatedActivation).toBeDefined();
      expect(res.body.data.estimatedActivationReason).toContain('Estimated');

      createdOrder = res.body.data;
    });

    it('returns identical order on repeated call with same idempotency key without creating duplicate', async () => {
      const res = await request(app)
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${ownerToken}`)
        .set('Idempotency-Key', idempotencyKey)
        .send({
          quoteId: testQuote.quoteId,
          leadId: testLead._id.toString(),
        });

      expect(res.status).toBe(201);
      expect(res.body.data.orderId).toBe(createdOrder.orderId);
      expect(res.body.data._id).toBe(createdOrder._id);

      // Count orders in DB with this idempotency key
      const count = await Order.countDocuments({ idempotencyKey });
      expect(count).toBe(1);
    });

    it('requires Idempotency-Key header', async () => {
      const res = await request(app)
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          quoteId: testQuote.quoteId,
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('IDEMPOTENCY_REQUIRED');
    });
  });

  describe('Order Retrieval & Security (IDOR Prevention)', () => {
    let order;

    beforeAll(async () => {
      order = await Order.findOne({ userId: ownerUser._id });
    });

    it('allows owner to retrieve their own order (GET /api/v1/orders/:id)', async () => {
      const res = await request(app)
        .get(`/api/v1/orders/${order.orderId}`)
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.data.orderId).toBe(order.orderId);
    });

    it('blocks another owner from accessing this order (403 Forbidden)', async () => {
      const res = await request(app)
        .get(`/api/v1/orders/${order.orderId}`)
        .set('Authorization', `Bearer ${secondOwnerToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('allows advisor staff to retrieve any order', async () => {
      const res = await request(app)
        .get(`/api/v1/orders/${order.orderId}`)
        .set('Authorization', `Bearer ${advisorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.data.orderId).toBe(order.orderId);
    });
  });

  describe('Installation Slot Scheduling', () => {
    let order;

    beforeAll(async () => {
      order = await Order.findOne({ userId: ownerUser._id });
    });

    it('schedules an installation slot date and time window', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 2);

      const res = await request(app)
        .post(`/api/v1/orders/${order.orderId}/slot`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          slotDate: tomorrow.toISOString(),
          timeWindow: '12:00 - 16:00',
        });

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.data.selectedSlot.timeWindow).toBe('12:00 - 16:00');
      expect(res.body.data.timeline.some((t) => t.status === 'INSTALL_SCHEDULED')).toBe(true);
    });
  });

  describe('Provisioning Simulator & Funnel Progression to ACTIVATED', () => {
    let order;

    beforeAll(async () => {
      order = await Order.findOne({ userId: ownerUser._id });
    });

    it('simulates feasibility check stage with telemetry note', async () => {
      const res = await request(app)
        .post(`/api/v1/orders/${order.orderId}/simulate-advance`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ targetStatus: 'FEASIBILITY_CHECK' });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('FEASIBILITY_CHECK');
      expect(res.body.data.feasibility.result).toBe('passed');
      expect(res.body.data.feasibility.reason).toContain('Optimal');
    });

    it('simulates equipment installation (CPE router and Wi-Fi)', async () => {
      const res = await request(app)
        .post(`/api/v1/orders/${order.orderId}/simulate-advance`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ targetStatus: 'INSTALLED' });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('INSTALLED');
      expect(res.body.data.paymentRecord.status).toBe('success');
    });

    it('simulates final activation and advances Lead to stage 5 (ACTIVATED)', async () => {
      const res = await request(app)
        .post(`/api/v1/orders/${order.orderId}/simulate-advance`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ targetStatus: 'ACTIVATED' });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('ACTIVATED');

      // Verify associated Lead has advanced to stage 5 ('activated')
      const updatedLead = await Lead.findById(testLead._id);
      expect(updatedLead.stageReached).toBe('activated');
      expect(updatedLead.stageOrdinal).toBe(5);
      expect(updatedLead.outcome).toBe('won');
    });
  });

  describe('Proactive Support (Help Request)', () => {
    let order;

    beforeAll(async () => {
      order = await Order.findOne({ userId: ownerUser._id });
    });

    it('creates proactive help request without calling customer care (POST /api/v1/orders/:id/help)', async () => {
      const res = await request(app)
        .post(`/api/v1/orders/${order.orderId}/help`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          reason: 'Need router placed on second floor of manufacturing unit',
          note: 'Please bring 20m patch cable.',
        });

      expect(res.status).toBe(201);
      expect(res.body.ok).toBe(true);
      expect(res.body.data.status).toBe('open');
      expect(res.body.data.contextSnapshot.orderId).toBe(order.orderId);

      const dbHelp = await HelpRequest.findById(res.body.data._id);
      expect(dbHelp).toBeDefined();
    });
  });
});
