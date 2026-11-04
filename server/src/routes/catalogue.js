import { Router } from 'express';
import { Product } from '../models/index.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const filter = { isActive: true };

    if (req.query.category) {
      filter.category = String(req.query.category).trim();
    }

    if (req.query.segment) {
      filter.targetSegments = String(req.query.segment).trim().toLowerCase();
    }

    const cityTier = req.query.city_tier || req.query.tier;
    if (cityTier) {
      filter.availableCityTiers = Number(cityTier);
    }

    const products = await Product.find(filter)
      .sort({ productId: 1 })
      .lean();

    res.status(200).json({
      ok: true,
      data: { products },
      meta: { total: products.length },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
