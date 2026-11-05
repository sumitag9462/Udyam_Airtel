import { z } from 'zod';
import {
  createQuote,
  getQuoteById,
  updateQuoteItems,
  previewQuoteScenario,
  acceptQuote,
} from '../services/quoteService.js';
import { explainRemoval } from '../rules/index.js';

const createQuoteSchema = z.object({
  leadId: z.string().optional(),
  tierLabel: z.enum(['starter', 'standard', 'resilient', 'custom']).optional(),
  lineItems: z
    .array(
      z.object({
        productId: z.string(),
        qty: z.coerce.number().int().min(1),
      }),
    )
    .optional(),
  profile: z.object({
    businessType: z.string().optional(),
    segment: z.enum(['prof', 'micro', 'multi', 'mfg']).optional(),
    employeeCount: z.coerce.number().int().min(1).default(1),
    numSites: z.coerce.number().int().min(1).default(1),
    cityTier: z.coerce.number().int().min(1).max(2).optional(),
    hasGstin: z.coerce.boolean().default(false),
    gstin: z.any().optional(),
    mustHaves: z.array(z.string()).default([]),
    budgetMonthly: z.coerce.number().optional().nullable(),
  }),
});

export async function handleCreateQuote(req, res, next) {
  try {
    const data = createQuoteSchema.parse(req.body);
    const quote = await createQuote({
      userId: req.user._id,
      leadId: data.leadId,
      tierLabel: data.tierLabel,
      lineItems: data.lineItems,
      profile: data.profile,
    });
    res.status(201).json({ ok: true, data: { quote } });
  } catch (err) {
    next(err);
  }
}

export async function handleGetQuote(req, res, next) {
  try {
    const quote = await getQuoteById(req.params.id, req.user);
    res.status(200).json({ ok: true, data: { quote } });
  } catch (err) {
    next(err);
  }
}

const updateItemsSchema = z.object({
  lineItems: z.array(
    z.object({
      productId: z.string(),
      qty: z.coerce.number().int().min(1),
    }),
  ),
});

export async function handleUpdateQuoteItems(req, res, next) {
  try {
    const { lineItems } = updateItemsSchema.parse(req.body);
    const quote = await updateQuoteItems(req.params.id, lineItems, req.user);
    res.status(200).json({ ok: true, data: { quote } });
  } catch (err) {
    next(err);
  }
}

const previewSchema = z.object({
  scenario: z.enum(['link_failure', 'budget_cut', 'second_site']),
});

export async function handlePreviewScenario(req, res, next) {
  try {
    const { scenario } = previewSchema.parse(req.body);
    const result = await previewQuoteScenario(req.params.id, scenario, req.user);
    res.status(200).json({ ok: true, data: { preview: result } });
  } catch (err) {
    next(err);
  }
}

export async function handleAcceptQuote(req, res, next) {
  try {
    const idempotencyKey = req.headers['idempotency-key'];
    const quote = await acceptQuote(req.params.id, idempotencyKey, req.user);
    res.status(200).json({ ok: true, data: { quote } });
  } catch (err) {
    next(err);
  }
}

export async function handleExplainRemoval(req, res, next) {
  try {
    const quote = await getQuoteById(req.params.id, req.user);
    const explanation = explainRemoval(quote, req.params.productId, quote.profileSnapshot);
    res.status(200).json({ ok: true, data: { explanation } });
  } catch (err) {
    next(err);
  }
}
