import path from 'node:path';
import fs from 'node:fs';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../../src/app.js';
import { config } from '../../src/config/env.js';
import { User, Lead, Conversation, Quote } from '../../src/models/index.js';
import { signAccessToken } from '../../src/utils/tokens.js';
import { checkResponseGuard, guardResponse } from '../../src/advisor/guard.js';
import { processAdvisorMessage } from '../../src/advisor/orchestrator.js';

describe('Phase 4: Advisor Chat & Response Guard Suite', () => {
  let testUser;
  let testToken;

  beforeAll(async () => {
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(config.MONGO_URI);
    }

    testUser = await User.create({
      role: 'owner',
      phoneHash: 'advisor_test_user_hash_1',
      phoneLast4: '8888',
      language: 'en',
    });
    testToken = signAccessToken(testUser);
  });

  afterAll(async () => {
    await User.deleteOne({ _id: testUser._id });
    await Lead.deleteMany({ ownerUserId: testUser._id });
    await Conversation.deleteMany({ userId: testUser._id });
    await Quote.deleteMany({ userId: testUser._id });
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
    }
  });

  describe('Response Guard Enforcement', () => {
    it('catches and blocks raw currency amounts in LLM text', () => {
      const textsWithRawPrices = [
        'The plan will cost ₹1499 per month.',
        'We offer this at Rs. 999 only.',
        'Total is 1200 rupees monthly.',
        'Special price: INR 2999.',
      ];

      for (const raw of textsWithRawPrices) {
        const check = checkResponseGuard(raw);
        expect(check.valid).toBe(false);
        expect(check.violations.some((v) => v.type === 'RAW_CURRENCY')).toBe(true);

        // Assert guard throws
        expect(() => guardResponse(raw, {})).toThrow();
      }
    });

    it('catches and blocks bare catalogue SKU codes in LLM text', () => {
      const textsWithRawCodes = [
        'I recommend P01 for your office.',
        'You should also add P09 for backup.',
        'Bundle includes P02 and P16.',
      ];

      for (const raw of textsWithRawCodes) {
        const check = checkResponseGuard(raw);
        expect(check.valid).toBe(false);
        expect(check.violations.some((v) => v.type === 'PRODUCT_CODE')).toBe(true);
        expect(() => guardResponse(raw, {})).toThrow();
      }
    });

    it('catches and blocks bare percentages in LLM text', () => {
      const textWithPercent = 'I can give you a 20% discount on this plan.';
      const check = checkResponseGuard(textWithPercent);
      expect(check.valid).toBe(false);
      expect(check.violations.some((v) => v.type === 'PERCENTAGE')).toBe(true);
      expect(() => guardResponse(textWithPercent, {})).toThrow();
    });

    it('passes safe placeholder templates and substitutes verified rule values', () => {
      const template =
        'Starter plan is {{tier.starter.monthlyTotal}}/mo and Standard is {{tier.standard.monthlyTotal}}/mo with setup of {{tier.starter.setupTotal}}.';

      const mockContext = {
        tiers: [
          { tierLabel: 'starter', monthlyTotal: 1745, setupTotal: 1000 },
          { tierLabel: 'standard', monthlyTotal: 2744, setupTotal: 1000 },
          { tierLabel: 'resilient', monthlyTotal: 4242, setupTotal: 1500 },
        ],
      };

      const sanitized = guardResponse(template, mockContext);
      expect(sanitized).toBe('Starter plan is ₹1,745/mo and Standard is ₹2,744/mo with setup of ₹1,000.');
    });
  });

  describe('25 Scripted Advisor Scenarios Evaluation', () => {
    const scenariosPath = path.resolve(process.cwd(), '../scenarios/advisor-scenarios.json');
    const scenarios = JSON.parse(fs.readFileSync(scenariosPath, 'utf8'));

    it('contains exactly 25 test scenarios', () => {
      expect(scenarios).toHaveLength(25);
    });

    for (const sc of scenarios) {
      it(`runs scenario ${sc.id}: ${sc.title}`, async () => {
        let conversationId = null;
        let finalResult = null;

        for (const turn of sc.turns) {
          finalResult = await processAdvisorMessage({
            conversationId,
            userId: testUser._id,
            messageText: turn.user,
            language: sc.language,
          });
          conversationId = finalResult.conversationId;
        }

        expect(finalResult).toBeDefined();
        // Check max questions limit constraint
        expect(finalResult.questionCount).toBeLessThanOrEqual(sc.maxQuestions);

        if (sc.expectedHandoff) {
          expect(finalResult.handoffRequested).toBe(true);
        }

        if (sc.expectedTiers) {
          expect(finalResult.tiers).toBeDefined();
          expect(finalResult.tiers.length).toBe(3);
        }

        if (sc.expectedSegment) {
          expect(finalResult.profile.segment).toBe(sc.expectedSegment);
        }

        // Response must never contain un-substituted {{...}} placeholders
        expect(finalResult.reply).not.toMatch(/\{\{[^}]+\}\}/);
      });
    }
  });

  describe('Advisor REST API Endpoints', () => {
    it('POST /api/v1/advisor/chat maintains multi-turn session and extracts profile', async () => {
      // Turn 1
      const res1 = await request(app)
        .post('/api/v1/advisor/chat')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          message: 'Hello, I have a dental clinic in Delhi with 5 employees.',
          language: 'en',
        });

      expect(res1.status).toBe(200);
      expect(res1.body.ok).toBe(true);
      const { conversationId, profile } = res1.body.data;
      expect(conversationId).toBeDefined();
      expect(profile.businessType).toBe('Dental clinic');
      expect(profile.city).toBe('Delhi');
      expect(profile.employeeCount).toBe(5);

      // Turn 2: Provide remaining details
      const res2 = await request(app)
        .post('/api/v1/advisor/chat')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          conversationId,
          message: 'We have 1 site and active GSTIN.',
          language: 'en',
        });

      expect(res2.status).toBe(200);
      expect(res2.body.data.tiers).toBeDefined();
      expect(res2.body.data.tiers.length).toBe(3);
      expect(res2.body.data.reply).toContain('Starter at ₹');

      // GET conversation history
      const res3 = await request(app)
        .get(`/api/v1/advisor/conversations/${conversationId}`)
        .set('Authorization', `Bearer ${testToken}`);

      expect(res3.status).toBe(200);
      expect(res3.body.data.conversation.messages.length).toBeGreaterThanOrEqual(4);
    });
  });
});
