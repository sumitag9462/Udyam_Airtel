import { Lead, Quote, Order, KycCase, Consent, Notification, HelpRequest, DeletionRequest, AuditLog } from '../models/index.js';
import AppError from '../utils/AppError.js';
import { z } from 'zod';

const deletionRequestSchema = z.object({
  reason: z.string().max(500).optional(),
});

/**
 * GET /api/v1/me/overview
 * Consolidates current user's business onboarding and operational state.
 */
export async function getOverview(req, res, next) {
  try {
    const userId = req.user._id;

    // Find lead linked to this user
    let lead = await Lead.findOne({ ownerUserId: userId }).sort({ createdAt: -1 });

    // Find quotes
    const quotes = await Quote.find({
      $or: [{ userId }, ...(lead ? [{ leadId: lead._id }] : [])],
    })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    const latestQuote = quotes[0] || null;

    if (!lead && latestQuote?.leadId) {
      lead = await Lead.findById(latestQuote.leadId);
    }

    // Find orders
    const orders = await Order.find({
      $or: [{ userId }, ...(lead ? [{ leadId: lead._id }] : [])],
    })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    const latestOrder = orders[0] || null;

    // Find KYC case
    let kycCase = null;
    if (lead) {
      kycCase = await KycCase.findOne({ leadId: lead._id }).sort({ createdAt: -1 }).lean();
    }

    // Find active consents
    const consents = await Consent.find({
      userId,
      withdrawnAt: { $exists: false },
    })
      .sort({ givenAt: -1 })
      .lean();

    // Find recent notifications (matching user's phoneLast4 or simulated)
    const notifications = await Notification.find({
      $or: [
        { toMasked: { $regex: req.user.phoneLast4 || '.*' } },
        { toMasked: { $exists: true } },
      ],
    })
      .sort({ sentAt: -1 })
      .limit(5)
      .lean();

    // Find help requests
    const helpRequests = await HelpRequest.find({ userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    // Determine next incomplete action
    let nextAction = {
      step: 'needs_assessment',
      label: 'Explore Connectivity Solutions',
      description: 'Chat with AI Advisor or select an enterprise bundle for your business',
      route: '/advisor',
    };

    if (!latestQuote) {
      nextAction = {
        step: 'needs_assessment',
        label: 'Get Your Custom Quote',
        description: 'Tell our AI advisor about your business needs or browse curated tiers',
        route: '/advisor',
      };
    } else if (latestQuote.status === 'draft') {
      nextAction = {
        step: 'quote_review',
        label: 'Review & Accept Quote',
        description: `${(latestQuote.tierLabel || 'custom').toUpperCase()} Pack · ₹${latestQuote.monthlyTotal.toLocaleString('en-IN')}/mo`,
        route: `/quotes/${latestQuote._id}`,
      };
    } else if (latestQuote.status === 'accepted' && (!kycCase || kycCase.status === 'draft')) {
      nextAction = {
        step: 'kyc_verification',
        label: 'Complete Smart KYC Verification',
        description: 'Upload business registration and signatory proof to proceed to dispatch',
        route: `/kyc?leadId=${lead?._id || ''}`,
      };
    } else if (kycCase?.status === 'manual_review') {
      nextAction = {
        step: 'kyc_under_review',
        label: 'KYC Document Verification in Progress',
        description: 'Your case has been flagged for human verification by Airtel compliance desk',
        route: '/kyc',
      };
    } else if (latestOrder) {
      if (latestOrder.stage === 'slot_booking' || !latestOrder.installationSlot?.date) {
        nextAction = {
          step: 'slot_booking',
          label: 'Schedule Installation Slot',
          description: 'Choose your preferred 2-hour technician visit window',
          route: `/tracker?orderId=${latestOrder._id}`,
        };
      } else if (latestOrder.stage === 'activated') {
        nextAction = {
          step: 'activated',
          label: 'Service Active & Live',
          description: 'High-speed business fiber connection is live. Optical telemetry verified.',
          route: `/tracker?orderId=${latestOrder._id}`,
        };
      } else {
        nextAction = {
          step: 'order_in_progress',
          label: 'Track Fiber Deployment',
          description: `Stage: ${latestOrder.stage.replace(/_/g, ' ')} · ETA: ${new Date(latestOrder.estimatedActivationDate).toLocaleDateString('en-IN')}`,
          route: `/tracker?orderId=${latestOrder._id}`,
        };
      }
    }

    res.json({
      ok: true,
      data: {
        user: {
          id: req.user._id,
          role: req.user.role,
          phoneLast4: req.user.phoneLast4,
          email: req.user.email,
          language: req.user.language,
        },
        lead: lead
          ? {
              id: lead._id,
              leadId: lead.leadId,
              businessName: lead.businessName,
              businessType: lead.businessType,
              segment: lead.segment,
              city: lead.city,
              cityTier: lead.cityTier,
              state: lead.state,
              employeeCount: lead.employeeCount,
              numSites: lead.numSites,
              hasGstin: lead.hasGstin,
              hasUdyam: lead.hasUdyam,
              stageReached: lead.stageReached,
            }
          : null,
        nextAction,
        latestQuote,
        latestOrder,
        kycStatus: kycCase ? kycCase.status : 'not_started',
        kycCaseId: kycCase ? kycCase._id : null,
        activeConsentsCount: consents.length,
        notificationsCount: notifications.length,
        recentNotifications: notifications,
        openHelpRequestsCount: helpRequests.filter((h) => h.status !== 'resolved').length,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/me/export
 * DPDP Act 2023 Section 11/12 Right to Data Portability
 */
export async function exportData(req, res, next) {
  try {
    const userId = req.user._id;

    const lead = await Lead.findOne({ ownerUserId: userId }).lean();
    const quotes = await Quote.find({
      $or: [{ userId }, ...(lead ? [{ leadId: lead._id }] : [])],
    }).lean();

    const orders = await Order.find({
      $or: [{ userId }, ...(lead ? [{ leadId: lead._id }] : [])],
    }).lean();

    let kycCases = [];
    if (lead) {
      kycCases = await KycCase.find({ leadId: lead._id }).lean();
    }

    const consents = await Consent.find({ userId }).lean();
    const helpRequests = await HelpRequest.find({ userId }).lean();

    const exportBundle = {
      complianceNotice: 'Data export provided pursuant to Section 11/12 of India Digital Personal Data Protection Act, 2023 (DPDP Act).',
      exportedAt: new Date().toISOString(),
      user: {
        id: req.user._id,
        role: req.user.role,
        phoneLast4: req.user.phoneLast4,
        email: req.user.email,
        language: req.user.language,
        createdAt: req.user.createdAt,
      },
      leadProfile: lead
        ? {
            leadId: lead.leadId,
            businessName: lead.businessName,
            businessType: lead.businessType,
            segment: lead.segment,
            city: lead.city,
            state: lead.state,
            employeeCount: lead.employeeCount,
            numSites: lead.numSites,
            hasGstin: lead.hasGstin,
            hasUdyam: lead.hasUdyam,
            stageReached: lead.stageReached,
          }
        : null,
      consents: consents.map((c) => ({
        noticeVersion: c.noticeVersion,
        purposes: c.purposes,
        documentTypes: c.documentTypes,
        givenAt: c.givenAt,
        withdrawnAt: c.withdrawnAt,
      })),
      kycOverview: kycCases.map((k) => ({
        caseId: k._id,
        status: k.status,
        autoVerified: k.autoVerified,
        riskScore: k.riskScore,
        checks: k.checks?.map((chk) => ({
          code: chk.code,
          name: chk.name,
          status: chk.status,
          severity: chk.severity,
        })),
        createdAt: k.createdAt,
      })),
      quotes: quotes.map((q) => ({
        quoteId: q._id,
        tierLabel: q.tierLabel,
        monthlyTotal: q.monthlyTotal,
        setupTotal: q.setupTotal,
        status: q.status,
        lineItems: q.lineItems,
        createdAt: q.createdAt,
        expiresAt: q.expiresAt,
      })),
      orders: orders.map((o) => ({
        orderId: o.orderId,
        stage: o.stage,
        monthlyTotal: o.monthlyTotal,
        estimatedActivationDate: o.estimatedActivationDate,
        installationSlot: o.installationSlot,
        timeline: o.timeline,
        createdAt: o.createdAt,
      })),
      helpRequests: helpRequests.map((h) => ({
        requestId: h._id,
        status: h.status,
        createdAt: h.createdAt,
        notesCount: h.notes?.length || 0,
      })),
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="udyam_one_data_export.json"');
    res.json(exportBundle);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/v1/me/deletion-requests
 * DPDP Act 2023 Section 12 Right to Erasure
 */
export async function requestDeletion(req, res, next) {
  try {
    const parseRes = deletionRequestSchema.safeParse(req.body);
    if (!parseRes.success) {
      throw new AppError('Invalid deletion request parameters.', 400, 'BAD_REQUEST', parseRes.error.flatten());
    }

    const userId = req.user._id;
    const lead = await Lead.findOne({ ownerUserId: userId });

    const request = await DeletionRequest.create({
      userId,
      leadId: lead?._id,
      reason: parseRes.data.reason || 'User initiated erasure request under DPDP Act 2023.',
      status: 'pending',
      requestedAt: new Date(),
    });

    // Mark all active consents as withdrawn
    await Consent.updateMany(
      { userId, withdrawnAt: { $exists: false } },
      { $set: { withdrawnAt: new Date() } }
    );

    // Create audit log
    await AuditLog.create({
      actorId: userId,
      role: req.user.role,
      action: 'DATA_DELETION_REQUESTED',
      entityType: 'DeletionRequest',
      entityId: String(request._id),
      metadata: {
        leadId: lead?._id ? String(lead._id) : null,
        phoneLast4: req.user.phoneLast4,
      },
    });

    res.status(201).json({
      ok: true,
      data: {
        requestId: request._id,
        status: 'pending',
        message: 'Your data erasure request has been logged. Under DPDP Act 2023 statutory obligations (taxation and telecom compliance), records will be scrubbed according to legal retention timelines.',
        requestedAt: request.requestedAt,
      },
    });
  } catch (err) {
    next(err);
  }
}
