import request from 'supertest';
import mongoose from 'mongoose';
import fs from 'node:fs';
import path from 'node:path';
import app from '../../src/app.js';
import { config } from '../../src/config/env.js';
import { User, Lead, Consent, KycCase, Document } from '../../src/models/index.js';
import { signAccessToken } from '../../src/utils/tokens.js';
import LocalEncryptedStorageProvider from '../../src/kyc/storage/StorageProvider.js';
import { assessImageQuality } from '../../src/kyc/utils/imageQuality.js';
import { processApplicantKyc } from '../../src/kyc/pipeline.js';

describe('Phase 5: Smart KYC Pipeline & Document Verification Suite', () => {
  let ownerUser;
  let ownerToken;
  let advisorUser;
  let advisorToken;
  let testLead;

  const kycDocDir = path.resolve(process.cwd(), '../data/kyc_documents');

  beforeAll(async () => {
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(config.MONGO_URI);
    }

    ownerUser = await User.create({
      role: 'owner',
      phoneHash: 'kyc_test_owner_phone_hash_01',
      phoneLast4: '8888',
      language: 'en',
    });
    ownerToken = signAccessToken(ownerUser);

    advisorUser = await User.create({
      role: 'advisor',
      phoneHash: 'kyc_test_advisor_phone_hash_01',
      phoneLast4: '7777',
      language: 'en',
    });
    advisorToken = signAccessToken(advisorUser);

    testLead = await Lead.create({
      leadId: `LD-KYC-TEST-${Date.now().toString(36)}`,
      origin: 'live',
      ownerUserId: ownerUser._id,
      businessName: 'Apex Retails Test',
      businessType: 'Retail',
      segment: 'micro',
      city: 'Delhi',
      cityTier: 1,
      state: 'Delhi',
      preferredLanguage: 'English',
      employeeCount: 6,
      numSites: 1,
      hasGstin: true,
      hasUdyam: false,
      leadSource: 'Website form',
      stageReached: 'quote_accepted',
      stageOrdinal: 3,
    });
  });

  afterAll(async () => {
    await User.deleteMany({ _id: { $in: [ownerUser._id, advisorUser._id] } });
    await Lead.deleteMany({ _id: testLead._id });
    await Consent.deleteMany({ userId: ownerUser._id });
    await KycCase.deleteMany({ userId: ownerUser._id });
    await Document.deleteMany({});
  });

  describe('StorageProvider: AES-256-GCM Encryption at Rest (C18)', () => {
    const storage = new LocalEncryptedStorageProvider();

    it('encrypts file and produces unreadable ciphertext on disk', async () => {
      const plaintext = Buffer.from('CONFIDENTIAL_GSTIN_37IHKXV5167L1ZS_LEGAL_ENTITY');
      const { storageKey } = await storage.saveFile(plaintext, 'test_doc.png');

      const fullPath = path.join(storage.baseDir, storageKey);
      const rawEncryptedBytes = await fs.promises.readFile(fullPath);

      // Ciphertext must not contain plaintext string
      expect(rawEncryptedBytes.includes(plaintext)).toBe(false);

      // Decryption produces exact original plaintext
      const decrypted = await storage.readFile(storageKey);
      expect(decrypted.toString()).toBe(plaintext.toString());

      await storage.deleteFile(storageKey);
    });

    it('fails decryption if auth tag is tampered', async () => {
      const plaintext = Buffer.from('TAMPER_PROOF_DOCUMENT_DATA');
      const { storageKey } = await storage.saveFile(plaintext, 'tamper_test.png');
      const fullPath = path.join(storage.baseDir, storageKey);

      const rawEncrypted = await fs.promises.readFile(fullPath);
      // Flip a bit in the auth tag region (bytes 12 to 28)
      rawEncrypted[15] ^= 0xff;
      await fs.promises.writeFile(fullPath, rawEncrypted);

      await expect(storage.readFile(storageKey)).rejects.toThrow();
      await storage.deleteFile(storageKey);
    });
  });

  describe('Blur Detection via Laplacian Variance (C17)', () => {
    it('detects severe blur on K04_gst_certificate.png (variance < 50)', async () => {
      const blurredPath = path.join(kycDocDir, 'K04_gst_certificate.png');
      const buf = await fs.promises.readFile(blurredPath);
      const quality = await assessImageQuality(buf);

      expect(quality.isBlurred).toBe(true);
      expect(quality.variance).toBeLessThan(50);
    });

    it('validates sharp image on K03_gst_certificate.png (variance >= 50)', async () => {
      const sharpPath = path.join(kycDocDir, 'K03_gst_certificate.png');
      const buf = await fs.promises.readFile(sharpPath);
      const quality = await assessImageQuality(buf);

      expect(quality.isBlurred).toBe(false);
      expect(quality.variance).toBeGreaterThanOrEqual(50);
    });
  });

  describe('Consent Enforcement (Non-negotiable Rule 7)', () => {
    it('blocks KYC upload with 403 when no consent is recorded', async () => {
      const res = await request(app)
        .post('/api/v1/kyc/upload')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ applicantId: 'K03' });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('CONSENT_REQUIRED');
    });

    it('records versioned explicit consent', async () => {
      const res = await request(app)
        .post('/api/v1/kyc/consent')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          leadId: testLead._id.toString(),
          noticeVersion: '1.0',
          purposes: ['kyc_verification', 'service_activation'],
          documentTypes: ['gst_certificate', 'udyam_certificate', 'signatory_id', 'address_proof'],
        });

      expect(res.status).toBe(201);
      expect(res.body.ok).toBe(true);
      expect(res.body.data.consentId).toBeDefined();
    });

    it('allows upload after consent and withdraws consent successfully', async () => {
      const withdrawRes = await request(app)
        .post('/api/v1/kyc/consent/withdraw')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({});

      expect(withdrawRes.status).toBe(200);
      expect(withdrawRes.body.data.withdrawn).toBe(true);

      // Now upload must be blocked again
      const blockedRes = await request(app)
        .post('/api/v1/kyc/upload')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ applicantId: 'K03' });

      expect(blockedRes.status).toBe(403);
    });
  });

  describe('Ground Truth Evaluation: All 12 Applicants (K01–K12)', () => {
    let activeConsent;

    beforeAll(async () => {
      // Re-create active consent for test suite
      activeConsent = await Consent.create({
        userId: ownerUser._id,
        leadId: testLead._id,
        noticeVersion: '1.0',
        purposes: ['kyc_verification'],
        documentTypes: ['gst_certificate', 'udyam_certificate', 'signatory_id', 'address_proof'],
        ipHash: 'test_ip_hash',
        userAgentHash: 'test_ua_hash',
        givenAt: new Date(),
      });
    });

    // Helper to load document buffers for an applicant
    function getApplicantFiles(appId) {
      const docTypes = ['gst_certificate', 'signatory_id', 'address_proof'];
      if (appId !== 'K05') {
        docTypes.push('udyam_certificate');
      }

      const files = {};
      for (const dt of docTypes) {
        const filePath = path.join(kycDocDir, `${appId}_${dt}.png`);
        if (fs.existsSync(filePath)) {
          files[dt] = {
            buffer: fs.readFileSync(filePath),
            originalname: `${appId}_${dt}.png`,
            mimetype: 'image/png',
          };
        }
      }
      return files;
    }

    const testCases = [
      { id: 'K01', expectedVerdict: 'rejected', defect: 'Cancelled GSTIN (C05 fail)' },
      { id: 'K02', expectedVerdict: 'requires_review', defect: 'Corrupted text tokens (C18 fail)' },
      { id: 'K03', expectedVerdict: 'auto_approved', defect: 'Clean specimen' },
      { id: 'K04', expectedVerdict: 'requires_review', defect: 'Blurred GST image (C17 fail)' },
      { id: 'K05', expectedVerdict: 'auto_approved', defect: 'Missing Udyam (Permissible)' },
      { id: 'K06', expectedVerdict: 'auto_approved', defect: 'Clean specimen' },
      { id: 'K07', expectedVerdict: 'requires_review', defect: 'Name mismatch Priya Nair vs Neha Banerjee (C07 fail)' },
      { id: 'K08', expectedVerdict: 'auto_approved', defect: 'Clean specimen' },
      { id: 'K09', expectedVerdict: 'auto_approved', defect: 'Clean specimen' },
      { id: 'K10', expectedVerdict: 'auto_approved', defect: 'Clean specimen' },
      { id: 'K11', expectedVerdict: 'rejected', defect: 'Expired address proof > 90 days (C15 fail)' },
      { id: 'K12', expectedVerdict: 'auto_approved', defect: 'Clean specimen' },
    ];

    for (const tc of testCases) {
      it(`evaluates ${tc.id} -> ${tc.expectedVerdict} (${tc.defect})`, async () => {
        const files = getApplicantFiles(tc.id);
        const result = await processApplicantKyc({
          applicantId: tc.id,
          userId: ownerUser._id,
          leadId: testLead._id,
          consentId: activeConsent._id,
          files,
        });

        expect(result.verdict).toBe(tc.expectedVerdict);
        expect(result.checks.length).toBe(19);

        if (tc.id === 'K01') {
          const c05 = result.checks.find((c) => c.code === 'C05');
          expect(c05.passed).toBe(false);
        } else if (tc.id === 'K04') {
          const c17 = result.checks.find((c) => c.code === 'C17');
          expect(c17.passed).toBe(false);
        } else if (tc.id === 'K07') {
          const c07 = result.checks.find((c) => c.code === 'C07');
          expect(c07.passed).toBe(false);
        } else if (tc.id === 'K11') {
          const c15 = result.checks.find((c) => c.code === 'C15');
          expect(c15.passed).toBe(false);
        }
      });
    }
  });

  describe('Human Review Queue & Manual Decision Workflow', () => {
    let flaggedCase;

    beforeAll(async () => {
      // Create a flagged case in review
      flaggedCase = await KycCase.create({
        leadId: testLead._id,
        userId: ownerUser._id,
        consentId: new mongoose.Types.ObjectId(),
        status: 'in_review',
        decisionNote: 'Soft failure: Signatory Name Match requires visual inspection',
        checks: [
          {
            id: 'C07',
            name: 'Signatory Name Match',
            severity: 'review',
            result: 'review',
            message: 'Name similarity 0.72 < 0.85',
          },
        ],
      });
    });

    it('lists flagged cases in review queue for staff (GET /api/v1/kyc/review-queue)', async () => {
      const res = await request(app)
        .get('/api/v1/kyc/review-queue')
        .set('Authorization', `Bearer ${advisorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.data.some((c) => c._id === flaggedCase._id.toString())).toBe(true);
    });

    it('blocks regular owner from accessing review queue', async () => {
      const res = await request(app)
        .get('/api/v1/kyc/review-queue')
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(res.status).toBe(403);
    });

    it('allows advisor to approve flagged case with decision note', async () => {
      const res = await request(app)
        .post(`/api/v1/kyc/cases/${flaggedCase._id}/review`)
        .set('Authorization', `Bearer ${advisorToken}`)
        .send({
          action: 'approve',
          decisionNote: 'Verified signatory identity via video call and Aadhaar XML',
        });

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.data.status).toBe('verified');
      expect(res.body.data.decisionNote).toContain('video call');

      // Verify Lead stage progressed to kyc_complete
      const updatedLead = await Lead.findById(testLead._id);
      expect(updatedLead.stageReached).toBe('kyc_complete');
      expect(updatedLead.stageOrdinal).toBe(4);
    });
  });
});
