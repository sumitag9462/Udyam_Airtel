import crypto from 'node:crypto';
import { Quote, Lead, Product } from '../models/index.js';
import {
  computeQuote,
  validateBundle,
  buildBundles,
  previewScenario,
} from '../rules/index.js';
import AppError from '../utils/AppError.js';
import { config } from '../config/env.js';
import logger from '../config/logger.js';

/**
 * Generate unique quote ID (e.g. Q-2026-ABCD12)
 */
export function generateQuoteId() {
  const hex = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `Q-2026-${hex}`;
}

/**
 * Create a new draft quote for a lead.
 * Can be built from a chosen tier ('starter'|'standard'|'resilient') or custom line items.
 */
export async function createQuote({ userId, leadId, tierLabel, lineItems, profile }) {
  const products = await Product.find({ isActive: true }).lean();
  let selectedItems = [];
  let indicativeOnly = false;
  let finalTierLabel = tierLabel || 'custom';

  if (tierLabel && ['starter', 'standard', 'resilient'].includes(tierLabel)) {
    const bundleRes = buildBundles(profile, products, { mode: config.PRICING_MODE });
    if (bundleRes.shortfall) {
      throw new AppError('Cannot generate tier: budget shortfall.', 422, 'BUDGET_SHORTFALL', bundleRes.shortfall);
    }
    const tier = bundleRes.tiers.find((t) => t.tierLabel === tierLabel);
    if (!tier) {
      throw new AppError(`Tier '${tierLabel}' not found.`, 404, 'TIER_NOT_FOUND');
    }
    selectedItems = tier.lineItems.map((i) => ({ productId: i.productId, qty: i.qty }));
    indicativeOnly = tier.indicativeOnly;
  } else if (Array.isArray(lineItems) && lineItems.length > 0) {
    selectedItems = lineItems.map((i) => ({ productId: i.productId, qty: Number(i.qty) }));
    finalTierLabel = 'custom';
  } else {
    throw new AppError('Either tierLabel or lineItems must be provided.', 400, 'BAD_REQUEST');
  }

  // Validate bundle against profile
  const validation = validateBundle(selectedItems, profile, products);
  if (!validation.valid) {
    throw new AppError('Selected items violate eligibility or dependency rules.', 422, 'INVALID_BUNDLE', validation.violations);
  }

  // Compute quote totals server-side
  const computed = computeQuote(selectedItems, products, config.PRICING_MODE);

  let effectiveLeadId = leadId;
  if (!effectiveLeadId && userId) {
    let existingLead = await Lead.findOne({ ownerUserId: userId });
    if (!existingLead) {
      existingLead = await Lead.create({
        leadId: `LEAD-${crypto.randomBytes(3).toString('hex').toUpperCase()}`,
        origin: 'live',
        ownerUserId: userId,
        businessName: profile.businessName || 'SMB Applicant',
        businessType: profile.businessType || 'CA / Law office',
        segment: profile.segment || 'prof',
        city: profile.city || 'Delhi',
        cityTier: profile.cityTier || 1,
        state: profile.state || 'Delhi',
        preferredLanguage: profile.preferredLanguage || 'en',
        employeeCount: profile.employeeCount || 1,
        numSites: profile.numSites || 1,
        hasGstin: Boolean(profile.hasGstin),
        hasUdyam: Boolean(profile.hasUdyam),
        leadSource: 'Website form',
        stageReached: 'Needs assessed',
        stageOrdinal: 2,
        stageDates: { needsAssessed: new Date() },
      });
    }
    effectiveLeadId = existingLead._id;
  }

  // Mark previous draft quotes for this lead/user as superseded
  await Quote.updateMany(
    { userId, status: 'draft' },
    { status: 'superseded' },
  );

  const expiresAt = new Date(Date.now() + config.QUOTE_TTL_DAYS * 24 * 60 * 60 * 1000);

  const quote = await Quote.create({
    quoteId: generateQuoteId(),
    leadId: effectiveLeadId,
    userId,
    profileSnapshot: profile,
    tierLabel: finalTierLabel,
    lineItems: computed.lineItems,
    monthlyTotal: computed.monthlyTotal,
    setupTotal: computed.setupTotal,
    contractMonths: computed.contractMonths,
    firstYearTotal: computed.firstYearTotal,
    pricingMode: config.PRICING_MODE,
    rulesVersion: products[0]?.rulesVersion || '1.0',
    priceHash: computed.priceHash,
    indicativeOnly,
    status: 'draft',
    expiresAt,
  });

  return quote;
}

/**
 * Get quote by ID, scoped by user ownership (or staff access).
 */
export async function getQuoteById(quoteId, user) {
  const query = { $or: [{ quoteId }, { _id: quoteId.match(/^[0-9a-fA-F]{24}$/) ? quoteId : null }] };
  const quote = await Quote.findOne(query);

  if (!quote) {
    throw new AppError('Quote not found.', 404, 'NOT_FOUND');
  }

  // Object-level scoping: Owners can only view their own quote
  if (user.role === 'owner' && quote.userId.toString() !== user._id.toString()) {
    throw new AppError('Forbidden: You do not have permission to view this quote.', 403, 'FORBIDDEN');
  }

  return quote;
}

/**
 * Update / toggle add-ons on a draft quote.
 * Client sends ONLY { productId, qty }.
 */
export async function updateQuoteItems(quoteId, lineItems, user) {
  const quote = await getQuoteById(quoteId, user);

  if (quote.status === 'accepted') {
    throw new AppError('Accepted quotes are immutable and cannot be modified.', 409, 'QUOTE_IMMUTABLE');
  }
  if (quote.status === 'expired' || quote.expiresAt < new Date()) {
    quote.status = 'expired';
    await quote.save();
    throw new AppError('Quote has expired. Please create a new quote.', 410, 'QUOTE_EXPIRED');
  }

  const products = await Product.find({ isActive: true }).lean();
  const selectedItems = lineItems.map((i) => ({ productId: i.productId, qty: Number(i.qty) }));

  // Validate bundle against original profile snapshot
  const validation = validateBundle(selectedItems, quote.profileSnapshot, products);
  if (!validation.valid) {
    throw new AppError('Updated bundle violates rules or dependencies.', 422, 'INVALID_BUNDLE', validation.violations);
  }

  const computed = computeQuote(selectedItems, products, config.PRICING_MODE);

  quote.lineItems = computed.lineItems;
  quote.monthlyTotal = computed.monthlyTotal;
  quote.setupTotal = computed.setupTotal;
  quote.contractMonths = computed.contractMonths;
  quote.firstYearTotal = computed.firstYearTotal;
  quote.priceHash = computed.priceHash;
  quote.tierLabel = 'custom';
  await quote.save();

  return quote;
}

/**
 * Run Business Preview scenario on quote.
 */
export async function previewQuoteScenario(quoteId, scenario, user) {
  const quote = await getQuoteById(quoteId, user);
  const products = await Product.find({ isActive: true }).lean();

  return previewScenario(quote, scenario, quote.profileSnapshot, products);
}

/**
 * Accept a quote with idempotency support.
 */
export async function acceptQuote(quoteId, idempotencyKey, user) {
  if (!idempotencyKey) {
    throw new AppError('Idempotency-Key header is required to accept a quote.', 400, 'IDEMPOTENCY_REQUIRED');
  }

  const quote = await getQuoteById(quoteId, user);

  // If already accepted, return idempotently
  if (quote.status === 'accepted') {
    return quote;
  }

  if (quote.status === 'expired' || quote.expiresAt < new Date()) {
    quote.status = 'expired';
    await quote.save();
    throw new AppError('Quote has expired and cannot be accepted.', 410, 'QUOTE_EXPIRED');
  }

  // Re-verify price integrity and catalogue drift before accepting
  const products = await Product.find({ isActive: true }).lean();
  const rawItems = quote.lineItems.map((i) => ({ productId: i.productId, qty: i.qty }));
  const recomputed = computeQuote(rawItems, products, quote.pricingMode);

  if (recomputed.priceHash !== quote.priceHash) {
    logger.warn({ quoteId, oldHash: quote.priceHash, newHash: recomputed.priceHash }, 'Price drift detected at quote acceptance');
    throw new AppError('Catalogue prices have changed. Please refresh and review your updated quote.', 409, 'PRICE_DRIFT');
  }

  quote.status = 'accepted';
  quote.acceptedAt = new Date();
  await quote.save();

  // Update lead stage to quoteAccepted (ordinal 3)
  if (quote.leadId) {
    await Lead.findByIdAndUpdate(quote.leadId, {
      stageReached: 'Quote accepted',
      stageOrdinal: 3,
      'stageDates.quoteAccepted': new Date(),
    });
  }

  return quote;
}
