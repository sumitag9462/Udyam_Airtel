import { Router } from 'express';
import { z } from 'zod';
import { Product } from '../models/index.js';
import {
  getEligibleProducts,
  segmentOf,
  buildBundles,
  validateBundle,
} from '../rules/index.js';
import { config } from '../config/env.js';

const router = Router();

const profileSchema = z.object({
  businessType: z.string().optional(),
  segment: z.enum(['prof', 'micro', 'multi', 'mfg']).optional(),
  employeeCount: z.coerce.number().int().min(1).default(1),
  numSites: z.coerce.number().int().min(1).default(1),
  cityTier: z.coerce.number().int().min(1).max(2).optional(),
  hasGstin: z.coerce.boolean().default(false),
  gstin: z.any().optional(),
  mustHaves: z.array(z.string()).default([]),
  budgetMonthly: z.coerce.number().optional().nullable(),
  needSpeed: z.coerce.boolean().optional(),
  needHighSpeed: z.coerce.boolean().optional(),
  cameras: z.coerce.number().optional(),
  devices: z.coerce.number().optional(),
  vehicles: z.coerce.number().optional(),
  channels: z.coerce.number().optional(),
  counters: z.coerce.number().optional(),
  mobileLines: z.coerce.number().optional(),
}).passthrough();

router.post('/eligible', async (req, res, next) => {
  try {
    const rawProfile = profileSchema.parse(req.body);
    const segment = rawProfile.segment || segmentOf(rawProfile.businessType);
    const profile = { ...rawProfile, segment };

    const products = await Product.find({ isActive: true }).lean();
    const results = getEligibleProducts(profile, products);

    res.status(200).json({
      ok: true,
      data: {
        segment,
        results,
      },
    });
  } catch (err) {
    next(err);
  }
});

router.post('/bundles', async (req, res, next) => {
  try {
    const rawProfile = profileSchema.parse(req.body);
    const segment = rawProfile.segment || segmentOf(rawProfile.businessType);
    const profile = { ...rawProfile, segment };

    const products = await Product.find({ isActive: true }).lean();
    const result = buildBundles(profile, products, { mode: config.PRICING_MODE });

    res.status(200).json({
      ok: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
});

const validateSchema = z.object({
  profile: profileSchema,
  lineItems: z.array(
    z.object({
      productId: z.string(),
      qty: z.coerce.number().int().min(1),
    }),
  ),
});

router.post('/validate', async (req, res, next) => {
  try {
    const { profile: rawProfile, lineItems } = validateSchema.parse(req.body);
    const segment = rawProfile.segment || segmentOf(rawProfile.businessType);
    const profile = { ...rawProfile, segment };

    const products = await Product.find({ isActive: true }).lean();
    const result = validateBundle(lineItems, profile, products);

    res.status(200).json({
      ok: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
