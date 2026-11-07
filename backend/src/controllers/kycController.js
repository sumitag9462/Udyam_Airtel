import crypto from 'node:crypto';
import { z } from 'zod';
import { Consent, KycCase, Lead, Order } from '../models/index.js';
import { processApplicantKyc, ConsentRequiredError } from '../kyc/pipeline.js';
import logger from '../config/logger.js';

const consentSchema = z.object({
  leadId: z.string().optional(),
  noticeVersion: z.string().default('1.0'),
  purposes: z.array(z.string()).default(['identity_verification', 'telecom_activation']),
  documentTypes: z.array(z.string()).default(['gst_certificate', 'udyam_certificate', 'signatory_id', 'address_proof']),
});

const reviewSchema = z.object({
  action: z.enum(['approve', 'reject']),
  decisionNote: z.string().min(3),
});

/**
 * Hash client IP and User-Agent for DPDP consent audit log without storing raw identifiers.
 */
function hashString(str) {
  return crypto.createHash('sha256').update(str || '').digest('hex');
}

/**
 * Record explicit applicant consent prior to document uploads.
 */
export async function createConsent(req, res, next) {
  try {
    const data = consentSchema.parse(req.body);
    const userId = req.user?._id;

    let leadId = data.leadId;
    if (!leadId && userId) {
      const lead = await Lead.findOne({ ownerUserId: userId });
      if (lead) leadId = lead._id;
    }

    if (!leadId) {
      // Find or create synthetic lead for owner
      const tempLead = new Lead({
        leadId: `LD-LIVE-${Date.now().toString(36).toUpperCase()}`,
        origin: 'live',
        ownerUserId: userId,
        businessName: req.user?.businessName || 'SMB Applicant',
        businessType: 'Retail',
        segment: 'micro',
        city: 'Delhi',
        cityTier: 1,
        state: 'Delhi',
        preferredLanguage: 'English',
        employeeCount: 5,
        numSites: 1,
        hasGstin: true,
        hasUdyam: false,
        leadSource: 'Website form',
        stageReached: 'quote_accepted',
        stageOrdinal: 3,
      });
      await tempLead.save();
      leadId = tempLead._id;
    }

    const consent = new Consent({
      userId,
      leadId,
      noticeVersion: data.noticeVersion,
      purposes: data.purposes,
      documentTypes: data.documentTypes,
      ipHash: hashString(req.ip),
      userAgentHash: hashString(req.headers['user-agent']),
      givenAt: new Date(),
    });

    await consent.save();

    logger.info({ consentId: consent._id, userId, leadId }, 'Explicit KYC consent recorded');

    res.status(201).json({
      ok: true,
      data: {
        consentId: consent._id,
        noticeVersion: consent.noticeVersion,
        purposes: consent.purposes,
        documentTypes: consent.documentTypes,
        givenAt: consent.givenAt,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Withdraw applicant consent (DPDP compliance).
 */
export async function withdrawConsent(req, res, next) {
  try {
    const userId = req.user?._id;
    const { consentId } = req.body;

    const query = {
      $and: [
        { $or: [{ _id: consentId }, { userId }].filter(Boolean) },
        { withdrawnAt: { $exists: false } },
      ],
    };

    const consent = await Consent.findOne(query);
    if (!consent) {
      return res.status(404).json({
        ok: false,
        error: { code: 'NOT_FOUND', message: 'Active consent record not found' },
      });
    }

    consent.withdrawnAt = new Date();
    await consent.save();

    // Mark any active kyc case as withdrawn
    await KycCase.updateMany({ userId: consent.userId, status: { $ne: 'verified' } }, { $set: { status: 'withdrawn' } });

    logger.info({ consentId: consent._id, userId }, 'KYC consent withdrawn by user');

    res.json({
      ok: true,
      data: {
        withdrawn: true,
        withdrawnAt: consent.withdrawnAt,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Process document upload and run full verification pipeline.
 */
export async function uploadKycDocuments(req, res, next) {
  try {
    const userId = req.user?._id;
    const { leadId, quoteId, quoteMongoId, consentId, applicantId } = req.body;

    const files = req.files || {};

    const result = await processApplicantKyc({
      userId,
      leadId,
      quoteId: quoteMongoId || quoteId,
      consentId,
      applicantId,
      files,
    });

    res.status(200).json({
      ok: true,
      data: {
        kycCaseId: result.kycCase._id,
        status: result.status,
        verdict: result.verdict,
        summary: result.summary,
        checks: result.checks,
        extractedValues: result.kycCase.extractedValues,
        retentionDays: result.retentionDays,
      },
    });
  } catch (err) {
    if (err instanceof ConsentRequiredError) {
      return res.status(403).json({
        ok: false,
        error: {
          code: 'CONSENT_REQUIRED',
          message: err.message,
        },
      });
    }
    next(err);
  }
}

/**
 * Get KYC case status and check details.
 */
export async function getKycCase(req, res, next) {
  try {
    const { id } = req.params;
    const kycCase = await KycCase.findById(id).populate('leadId').populate('quoteId');

    if (!kycCase) {
      return res.status(404).json({
        ok: false,
        error: { code: 'NOT_FOUND', message: 'KYC case not found' },
      });
    }

    // Role-based access control: Owners can only view their own case
    if (req.user?.role === 'owner' && !kycCase.userId?.equals(req.user._id)) {
      return res.status(403).json({
        ok: false,
        error: { code: 'FORBIDDEN', message: 'You are not authorized to view this KYC case' },
      });
    }

    res.json({
      ok: true,
      data: kycCase,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * List cases awaiting human review in the back-office queue.
 */
export async function getReviewQueue(req, res, next) {
  try {
    const cases = await KycCase.find({ status: { $in: ['in_review', 'action_needed'] } })
      .populate('leadId', 'businessName businessType phone city state stageReached leadSource')
      .populate('userId', 'phone role name')
      .sort({ updatedAt: -1 })
      .limit(50);

    res.json({
      ok: true,
      data: cases,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Human agent manual decision (approve or reject) for a flagged KYC case.
 */
export async function reviewKycCase(req, res, next) {
  try {
    const { id } = req.params;
    const { action, decisionNote } = reviewSchema.parse(req.body);

    const kycCase = await KycCase.findById(id);
    if (!kycCase) {
      return res.status(404).json({
        ok: false,
        error: { code: 'NOT_FOUND', message: 'KYC case not found' },
      });
    }

    const reviewerId = req.user?._id;
    kycCase.reviewer = reviewerId;
    kycCase.decisionNote = decisionNote;
    kycCase.decidedAt = new Date();

    if (action === 'approve') {
      kycCase.status = 'verified';

      // Update lead
      if (kycCase.leadId) {
        const lead = await Lead.findById(kycCase.leadId);
        if (lead && lead.stageOrdinal < 4) {
          lead.stageReached = 'kyc_complete';
          lead.stageOrdinal = 4;
          lead.stageDates = lead.stageDates || {};
          lead.stageDates.kycComplete = new Date();
          await lead.save();
        }
      }

      // Update order if present
      if (kycCase.quoteId) {
        const order = await Order.findOne({ quoteId: kycCase.quoteId });
        if (order) {
          order.status = 'KYC_VERIFIED';
          await order.save();
        }
      }
    } else {
      kycCase.status = 'rejected';

      if (kycCase.quoteId) {
        const order = await Order.findOne({ quoteId: kycCase.quoteId });
        if (order) {
          order.status = 'KYC_ACTION_NEEDED';
          await order.save();
        }
      }
    }

    await kycCase.save();

    logger.info({ caseId: id, action, reviewerId }, 'Manual KYC review decision executed');

    res.json({
      ok: true,
      data: kycCase,
    });
  } catch (err) {
    next(err);
  }
}
