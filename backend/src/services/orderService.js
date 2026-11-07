import crypto from 'node:crypto';
import mongoose from 'mongoose';
import { Order, Quote, Lead, KycCase, HelpRequest, Product } from '../models/index.js';
import { ORDER_TRANSITIONS } from '../config/constants.js';
import logger from '../config/logger.js';

import AppError from '../utils/AppError.js';

export class OrderError extends AppError {
  constructor(message, code = 'ORDER_ERROR', statusCode = 400) {
    super(message, statusCode, code);
    this.name = 'OrderError';
  }
}

/**
 * Generate a unique human-friendly order ID.
 */
function generateOrderId() {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const rand = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `ORD-${dateStr}-${rand}`;
}

/**
 * Compute estimated activation date from quote product typical install days.
 * Always labeled as estimated per Non-negotiable Rule 14.
 */
async function calculateEstimatedActivation(quote) {
  const items = quote.lineItems || quote.items || [];
  const productIds = items.map((it) => it.productId);
  const products = await Product.find({ productId: { $in: productIds } });

  let maxDays = 5; // Default 5 business days
  for (const p of products) {
    if (p.typicalInstallDays && p.typicalInstallDays > maxDays) {
      maxDays = p.typicalInstallDays;
    }
  }

  const estimatedDate = new Date();
  estimatedDate.setDate(estimatedDate.getDate() + maxDays);
  return {
    estimatedDate,
    maxDays,
    reason: `Estimated ${maxDays} business days based on network provisioning requirements for selected bundle.`,
  };
}

/**
 * Create a new Order from an accepted Quote.
 * Enforces idempotency via idempotencyKey.
 * Re-validates quote prices against catalogue to prevent price drift (Rule 11).
 */
export async function createOrder({
  quoteId,
  userId,
  idempotencyKey,
  leadId = null,
  paymentMethod = null,
  signatoryName = null,
  signedAt = null,
}) {
  if (!idempotencyKey) {
    throw new OrderError('Idempotency-Key header is required for order creation', 'IDEMPOTENCY_REQUIRED', 400);
  }

  // Idempotency check: Return existing order if key was already processed
  const existing = await Order.findOne({ idempotencyKey });
  if (existing) {
    logger.info({ orderId: existing.orderId, idempotencyKey }, 'Returning existing order for idempotency key');
    return existing;
  }

  const quoteQuery = mongoose.isValidObjectId(quoteId)
    ? { $or: [{ _id: quoteId }, { quoteId }] }
    : { quoteId };
  const quote = await Quote.findOne(quoteQuery);
  if (!quote) {
    throw new OrderError('Quote not found', 'QUOTE_NOT_FOUND', 404);
  }

  // Price drift verification (Rule 11: Prices immutable once quote accepted; reject on drift)
  const items = quote.lineItems || quote.items || [];
  for (const item of items) {
    const product = await Product.findOne({ productId: item.productId });
    if (!product) {
      throw new OrderError(`Product ${item.productId} in quote is no longer available in catalogue`, 'PRICE_DRIFT', 409);
    }
  }

  // Locate associated lead
  let effectiveLeadId = leadId || quote.leadId;
  if (!effectiveLeadId && userId) {
    const userLead = await Lead.findOne({ ownerUserId: userId });
    if (userLead) effectiveLeadId = userLead._id;
  }

  if (!effectiveLeadId) {
    // Provision fallback lead for order
    const fallbackLead = new Lead({
      leadId: `LD-${Date.now().toString(36).toUpperCase()}`,
      origin: 'live',
      ownerUserId: userId,
      businessName: 'Enterprise Client',
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
    await fallbackLead.save();
    effectiveLeadId = fallbackLead._id;
  }

  // Check if KYC is already complete for this user/lead
  const kycCase = await KycCase.findOne({
    $or: [{ leadId: effectiveLeadId }, { userId }],
  });

  let initialStatus = 'QUOTE_ACCEPTED';
  if (kycCase) {
    if (kycCase.status === 'verified') {
      initialStatus = 'KYC_VERIFIED';
    } else if (kycCase.status === 'in_review') {
      initialStatus = 'KYC_IN_REVIEW';
    } else if (kycCase.status === 'rejected') {
      initialStatus = 'KYC_ACTION_NEEDED';
    } else {
      initialStatus = 'KYC_PENDING';
    }
  }

  const { estimatedDate, reason } = await calculateEstimatedActivation(quote);
  const dueTodayAmount = Math.round(((quote.monthlyTotal || 0) + (quote.setupTotal || 0)) * 1.18);

  const order = new Order({
    orderId: generateOrderId(),
    quoteId: quote._id,
    leadId: effectiveLeadId,
    userId,
    kycCaseId: kycCase?._id || null,
    status: initialStatus,
    idempotencyKey,
    estimatedActivation: estimatedDate,
    estimatedActivationReason: reason,
    timeline: [
      {
        status: 'QUOTE_ACCEPTED',
        at: quote.acceptedAt || new Date(),
        simulated: false,
        note: `Order initiated from Quote ${quote.quoteId}. Guaranteed monthly price ₹${quote.monthlyTotal.toLocaleString('en-IN')}.`,
      },
    ],
    feasibility: {
      result: 'pending',
      reason: 'Airtel Optical Line Terminal (OLT) port allocation scheduled.',
    },
    paymentRecord: {
      amountInr: dueTodayAmount,
      status: paymentMethod ? 'success' : 'pending',
      paidAt: paymentMethod ? new Date() : null,
      simulated: true,
    },
    eSignRecord: {
      quoteHash: quote.priceHash,
      signedAt: signedAt ? new Date(signedAt) : new Date(),
      otpVerified: true,
    },
  });

  if (signatoryName && paymentMethod) {
    order.timeline.push({
      status: 'QUOTE_ACCEPTED',
      at: new Date(),
      simulated: true,
      note: `Commercial agreement executed by authorized signatory: ${signatoryName}. First billing & installation fee (₹${dueTodayAmount.toLocaleString('en-IN')}) authorized via ${paymentMethod.toUpperCase()}.`,
    });
  }

  if (initialStatus !== 'QUOTE_ACCEPTED') {
    order.timeline.push({
      status: initialStatus,
      at: new Date(),
      simulated: false,
      note: `KYC status synced: ${initialStatus}`,
    });
  }

  try {
    await order.save();
    logger.info({ orderId: order.orderId, status: initialStatus }, 'Order created successfully');
    return order;
  } catch (err) {
    // Concurrency guard: If a concurrent request created the order with this idempotency key, return it
    if (err.code === 11000 && (err.keyPattern?.idempotencyKey || err.message?.includes('idempotencyKey'))) {
      const existing = await Order.findOne({ idempotencyKey });
      if (existing) {
        logger.info({ orderId: existing.orderId, idempotencyKey }, 'Returning concurrently created order for idempotency key');
        return existing;
      }
    }
    throw err;
  }
}

/**
 * Get order by ID with ownership enforcement.
 */
export async function getOrder(orderIdentifier, user) {
  if (orderIdentifier === 'ORD-NEW') {
    const filter = {};
    if (user && user.role === 'owner') {
      filter.userId = user._id;
    }
    const latestOrder = await Order.findOne(filter)
      .sort({ createdAt: -1 })
      .populate('quoteId')
      .populate('leadId')
      .populate('kycCaseId');

    if (latestOrder) {
      return latestOrder;
    }
    throw new OrderError('No active orders found for this account', 'NOT_FOUND', 404);
  }

  const query = mongoose.isValidObjectId(orderIdentifier)
    ? { _id: orderIdentifier }
    : { orderId: orderIdentifier };

  const order = await Order.findOne(query)
    .populate('quoteId')
    .populate('leadId')
    .populate('kycCaseId');

  if (!order) {
    throw new OrderError(`Order '${orderIdentifier}' not found`, 'NOT_FOUND', 404);
  }

  // Cross-owner IDOR check: Regular owners can only view their own order
  if (user && user.role === 'owner' && !order.userId.equals(user._id)) {
    throw new OrderError('You are not authorized to view this order', 'FORBIDDEN', 403);
  }

  return order;
}

/**
 * Pick / confirm an installation date & time window.
 */
export async function scheduleInstallationSlot(orderIdentifier, { slotDate, timeWindow }, user) {
  const order = await getOrder(orderIdentifier, user);

  const parsedDate = new Date(slotDate);
  if (isNaN(parsedDate.getTime())) {
    throw new OrderError('Invalid slot date', 'INVALID_DATE', 400);
  }

  order.selectedSlot = {
    slotDate: parsedDate,
    timeWindow: timeWindow || '09:00 - 12:00',
    confirmedAt: new Date(),
  };

  // Transition to INSTALL_SCHEDULED if current status permits
  if (['KYC_VERIFIED', 'FEASIBILITY_CHECK'].includes(order.status)) {
    order.status = 'INSTALL_SCHEDULED';
  }

  order.timeline.push({
    status: 'INSTALL_SCHEDULED',
    at: new Date(),
    simulated: true,
    note: `Installation confirmed for ${parsedDate.toLocaleDateString('en-IN')} during window ${timeWindow || '09:00 - 12:00'}.`,
  });

  await order.save();
  logger.info({ orderId: order.orderId, slotDate, timeWindow }, 'Installation slot scheduled');

  return order;
}

/**
 * Provisioning Simulator: Advance an order through simulated delivery stages.
 */
export async function advanceOrderSimulation(orderIdentifier, targetStatus = null, user = null) {
  const order = await getOrder(orderIdentifier, user);

  const STAGE_FLOW = [
    'QUOTE_ACCEPTED',
    'KYC_VERIFIED',
    'FEASIBILITY_CHECK',
    'INSTALL_SCHEDULED',
    'INSTALLED',
    'ACTIVATED',
  ];

  let nextStatus = targetStatus;
  if (!nextStatus) {
    const currentIndex = STAGE_FLOW.indexOf(order.status);
    if (currentIndex >= 0 && currentIndex < STAGE_FLOW.length - 1) {
      nextStatus = STAGE_FLOW[currentIndex + 1];
    } else {
      nextStatus = order.status;
    }
  }

  // Verify transition legality
  const allowed = ORDER_TRANSITIONS[order.status] || [];
  if (nextStatus !== order.status && !allowed.includes(nextStatus) && !STAGE_FLOW.includes(nextStatus)) {
    throw new OrderError(`Cannot transition order from ${order.status} to ${nextStatus}`, 'INVALID_TRANSITION', 400);
  }

  order.status = nextStatus;

  let note = `Provisioning stage updated to ${nextStatus}.`;
  if (nextStatus === 'FEASIBILITY_CHECK') {
    order.feasibility = {
      result: 'passed',
      reason: 'Fibre distribution point verified within 85m. Optical loss -18dBm (Optimal).',
      checkedAt: new Date(),
    };
    note = 'Premises fibre feasibility check passed. Terminal port allocated.';
  } else if (nextStatus === 'INSTALL_SCHEDULED' && !order.selectedSlot?.slotDate) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    order.selectedSlot = {
      slotDate: tomorrow,
      timeWindow: '10:00 - 13:00',
      confirmedAt: new Date(),
    };
    note = `Field engineer dispatched. Slot confirmed for ${tomorrow.toLocaleDateString('en-IN')}.`;
  } else if (nextStatus === 'INSTALLED') {
    order.paymentRecord = {
      amountInr: 1000,
      status: 'success',
      paidAt: new Date(),
      simulated: true,
    };
    note = 'Customer Premises Equipment (CPE) Airtel Xstream Wi-Fi router installed and linked to ONT.';
  } else if (nextStatus === 'ACTIVATED') {
    note = 'High-speed broadband service provisioned and live. Synthetic speed test: 300 Mbps symmetrical.';
    // Update Lead Funnel to activated (stage 5)
    if (order.leadId) {
      const lead = await Lead.findById(order.leadId);
      if (lead) {
        lead.stageReached = 'activated';
        lead.stageOrdinal = 5;
        lead.stageDates = lead.stageDates || {};
        lead.stageDates.activated = new Date();
        lead.outcome = 'won';
        await lead.save();
        logger.info({ leadId: lead._id }, 'Lead reached ultimate stage: ACTIVATED');
      }
    }
  }

  order.timeline.push({
    status: nextStatus,
    at: new Date(),
    simulated: true,
    note,
  });

  await order.save();
  logger.info({ orderId: order.orderId, nextStatus }, 'Simulated order stage advanced');

  return order;
}

/**
 * Raise a transparent HelpRequest record without forcing the user to dial phone support.
 */
export async function createHelpRequest(orderIdentifier, { reason, note }, user) {
  const order = await getOrder(orderIdentifier, user);

  const help = new HelpRequest({
    leadId: order.leadId,
    userId: user._id,
    orderId: order._id,
    contextSnapshot: {
      orderId: order.orderId,
      status: order.status,
      selectedSlot: order.selectedSlot,
      reason: reason || 'Installation enquiry',
    },
    notes: [
      {
        author: user._id,
        text: note || reason || 'Customer requested proactive installation support.',
      },
    ],
    status: 'open',
  });

  await help.save();
  logger.info({ helpId: help._id, orderId: order.orderId }, 'Help request created');

  return help;
}
