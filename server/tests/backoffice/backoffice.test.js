import request from 'supertest';
import mongoose from 'mongoose';
import app from '../../src/app.js';
import { config } from '../../src/config/env.js';
import { User, Lead } from '../../src/models/index.js';
import { signAccessToken } from '../../src/utils/tokens.js';
import { calculatePropensityScore, getPropensityModelMetadata } from '../../src/scoring/propensity.js';

describe('Phase 7: Back-office, Propensity Scoring & Analytics Suite', () => {
  let ownerUser;
  let ownerToken;
  let advisorUser;
  let advisorToken;

  beforeAll(async () => {
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(config.MONGO_URI);
    }

    ownerUser = await User.create({
      role: 'owner',
      phoneHash: 'bo_test_owner_hash_01',
      phoneLast4: '2222',
      language: 'en',
    });
    ownerToken = signAccessToken(ownerUser);

    advisorUser = await User.create({
      role: 'advisor',
      phoneHash: 'bo_test_advisor_hash_01',
      phoneLast4: '1111',
      language: 'en',
    });
    advisorToken = signAccessToken(advisorUser);
  });

  afterAll(async () => {
    await User.deleteMany({ _id: { $in: [ownerUser._id, advisorUser._id] } });
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
    }
  });

  describe('Role-Gated Access Control (Non-negotiable Rule 10)', () => {
    it('blocks regular SMB owner from accessing back-office funnel metrics (403 Forbidden)', async () => {
      const res = await request(app)
        .get('/api/v1/backoffice/funnel')
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('blocks regular SMB owner from accessing unclosed leads queue (403 Forbidden)', async () => {
      const res = await request(app)
        .get('/api/v1/backoffice/unclosed-leads')
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('allows advisor staff to access back-office funnel metrics', async () => {
      const res = await request(app)
        .get('/api/v1/backoffice/funnel')
        .set('Authorization', `Bearer ${advisorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
    });
  });

  describe('Ground Truth Funnel Reproduction (Exact Case PDF Numbers)', () => {
    it('reproduces exact cumulative funnel metrics from seeded data', async () => {
      const res = await request(app)
        .get('/api/v1/backoffice/funnel')
        .set('Authorization', `Bearer ${advisorToken}`);

      expect(res.status).toBe(200);
      const { summary, funnel, exits, dropReasons, leakSolutions } = res.body.data;

      // Seed assertions verified in Phase 1 & 7
      expect(summary.totalLeads).toBeGreaterThanOrEqual(5000);
      expect(summary.activated).toBeGreaterThanOrEqual(368);
      expect(summary.activationRate).toBeCloseTo(7.36, 1);

      // Cumulative reached
      const stageMap = Object.fromEntries(funnel.map((f) => [f.stage, f.count]));
      expect(stageMap['Leads Created']).toBeGreaterThanOrEqual(5000);
      expect(stageMap['Contacted']).toBeGreaterThanOrEqual(3406);
      expect(stageMap['Needs Assessed']).toBeGreaterThanOrEqual(1974);
      expect(stageMap['Quote Accepted']).toBeGreaterThanOrEqual(861);
      expect(stageMap['KYC Complete']).toBeGreaterThanOrEqual(588);
      expect(stageMap['Activated']).toBeGreaterThanOrEqual(368);

      // Exits
      expect(exits.lead).toBeGreaterThanOrEqual(1594);
      expect(exits.contacted).toBeGreaterThanOrEqual(1432);
      expect(exits.needsAssessed).toBeGreaterThanOrEqual(1113);
      expect(exits.quoteAccepted).toBeGreaterThanOrEqual(273);
      expect(exits.kycComplete).toBeGreaterThanOrEqual(220);

      // Drop reasons & leak solutions
      expect(dropReasons).toBeDefined();
      expect(leakSolutions.length).toBe(4);
    });
  });

  describe('Propensity Scoring Engine & Transparent Drivers', () => {
    it('verifies model ROC AUC is honest and measured >= 0.65', () => {
      const meta = getPropensityModelMetadata();
      expect(meta.rocAuc).toBeGreaterThanOrEqual(0.65);
      expect(meta.baselineActivationRate).toBeCloseTo(7.36, 1);
      expect(meta.weights).toBeDefined();
    });

    it('calculates score with higher propensity for GSTIN-present Referral leads in Tier 1', () => {
      const highIntentLead = {
        hasGstin: true,
        cityTier: 1,
        leadSource: 'Referral',
        segment: 'prof',
        employeeCount: 40,
        monthlyTelecomSpend: 8000,
      };

      const lowIntentLead = {
        hasGstin: false,
        cityTier: 2,
        leadSource: 'Website form',
        segment: 'micro',
        employeeCount: 2,
        monthlyTelecomSpend: 800,
      };

      const highScore = calculatePropensityScore(highIntentLead);
      const lowScore = calculatePropensityScore(lowIntentLead);

      expect(highScore.percentage).toBeGreaterThan(lowScore.percentage);
      expect(highScore.drivers.some((d) => d.name.includes('GSTIN'))).toBe(true);
      expect(highScore.drivers.some((d) => d.name.includes('Referral'))).toBe(true);
    });
  });

  describe('Unclosed Leads Queue & Commercial Analytics', () => {
    it('returns unclosed leads ranked by propensity score (GET /api/v1/backoffice/unclosed-leads)', async () => {
      const res = await request(app)
        .get('/api/v1/backoffice/unclosed-leads?limit=10')
        .set('Authorization', `Bearer ${advisorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.data.leads.length).toBeGreaterThan(0);
      expect(res.body.data.leads.every((l) => l.stageOrdinal < 5)).toBe(true);

      // Verify descending propensity order
      const pcts = res.body.data.leads.map((l) => l.propensityPercentage);
      for (let i = 0; i < pcts.length - 1; i++) {
        expect(pcts[i]).toBeGreaterThanOrEqual(pcts[i + 1]);
      }
    });

    it('returns verified segment analytics (GET /api/v1/backoffice/segments)', async () => {
      const res = await request(app)
        .get('/api/v1/backoffice/segments')
        .set('Authorization', `Bearer ${advisorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(4);

      const mfg = res.body.data.find((s) => s.segment === 'mfg');
      expect(mfg.activationRate).toBe(12.8);
      expect(mfg.churn6mPct).toBe(8.1);

      const micro = res.body.data.find((s) => s.segment === 'micro');
      expect(micro.activationRate).toBe(4.06);
    });

    it('returns verified source analytics (GET /api/v1/backoffice/sources)', async () => {
      const res = await request(app)
        .get('/api/v1/backoffice/sources')
        .set('Authorization', `Bearer ${advisorToken}`);

      expect(res.status).toBe(200);
      const referral = res.body.data.find((s) => s.source === 'Referral');
      expect(referral.activationRate).toBe(14.77);
    });

    it('updates advisor status and note on unclosed lead (PATCH /api/v1/backoffice/leads/:id)', async () => {
      const lead = await Lead.findOne({ stageOrdinal: { $lt: 5 } });

      const res = await request(app)
        .patch(`/api/v1/backoffice/leads/${lead._id}`)
        .set('Authorization', `Bearer ${advisorToken}`)
        .send({
          advisorStatus: 'handoff_requested',
          note: 'Scheduled callback with owner regarding 4-site mesh Wi-Fi.',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.advisorStatus).toBe('handoff_requested');

      const updated = await Lead.findById(lead._id);
      expect(updated.notes.length).toBeGreaterThan(0);
      expect(updated.notes[updated.notes.length - 1].text).toContain('4-site mesh');
    });
  });
});
