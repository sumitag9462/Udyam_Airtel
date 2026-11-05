import path from 'node:path';
import { parseProductCatalogue } from '../../seed/parse.js';
import {
  buildBundles,
  computeQuote,
  validateBundle,
  checkProductEligibility,
  getEligibleProducts,
  REASON_CODES,
} from '../../src/rules/index.js';

describe('Rules Engine: Golden Tests (Section 9.7)', () => {
  const products = parseProductCatalogue(
    path.resolve(process.cwd(), '../data/product_catalogue.csv')
  );

  describe('Golden Test 1: Professional Office', () => {
    // 14 staff, 1 site, Tier 1 or 2
    const profile = {
      businessType: 'Dental clinic',
      segment: 'prof',
      employeeCount: 14,
      numSites: 1,
      cityTier: 1,
      hasGstin: true,
      gstin: { present: true, valid: true, status: 'Active' },
    };

    it('computes exact Starter, Standard, and Resilient totals', () => {
      const { tiers, shortfall } = buildBundles(profile, products, { mode: 'min' });
      expect(shortfall).toBeNull();
      expect(tiers).toHaveLength(3);

      const [starter, standard, resilient] = tiers;

      // Starter: P01 + 14 x P16 = ₹2,749/month, setup ₹0
      expect(starter.monthlyTotal).toBe(2749);
      expect(starter.setupTotal).toBe(0);
      expect(starter.lineItems.map((i) => i.productId).sort()).toEqual(['P01', 'P16'].sort());
      const p16Starter = starter.lineItems.find((i) => i.productId === 'P16');
      expect(p16Starter.qty).toBe(14);
      expect(p16Starter.lineMonthly).toBe(1750); // 125 * 14

      // Standard = + 14 x P20 + P17 = ₹4,634
      expect(standard.monthlyTotal).toBe(4634);
      expect(standard.setupTotal).toBe(0);
      expect(standard.lineItems.map((i) => i.productId).sort()).toEqual(
        ['P01', 'P16', 'P17', 'P20'].sort()
      );

      // Resilient = + P09 = ₹5,133, setup ₹1,500, contract 12 months, first-year ₹63,096
      expect(resilient.monthlyTotal).toBe(5133);
      expect(resilient.setupTotal).toBe(1500);
      expect(resilient.contractMonths).toBe(12);
      expect(resilient.firstYearTotal).toBe(63096);
      expect(resilient.lineItems.map((i) => i.productId).sort()).toEqual(
        ['P01', 'P09', 'P16', 'P17', 'P20'].sort()
      );
    });
  });

  describe('Golden Test 2: Kirana without GSTIN', () => {
    // 1 site, 2 staff, Tier 2, budget ₹1,500
    const profile = {
      businessType: 'Kirana store',
      segment: 'micro',
      employeeCount: 2,
      numSites: 1,
      cityTier: 2,
      budgetMonthly: 1500,
      hasGstin: false,
      gstin: null,
    };

    it('selects P04 + 1 x P19 = ₹1,498/month, setup ₹2,500, first-year ₹20,476', () => {
      const { tiers, shortfall } = buildBundles(profile, products, { mode: 'min' });
      expect(shortfall).toBeNull();
      const starter = tiers.find((t) => t.tierLabel === 'starter');

      expect(starter.monthlyTotal).toBe(1498);
      expect(starter.setupTotal).toBe(2500);
      expect(starter.contractMonths).toBe(12);
      expect(starter.firstYearTotal).toBe(20476);

      const itemIds = starter.lineItems.map((i) => i.productId).sort();
      expect(itemIds).toEqual(['P04', 'P19'].sort());
    });

    it('blocks P15, P14 and P13 with GSTIN_REQUIRED', () => {
      const eligible = getEligibleProducts(profile, products);
      const eligibleMap = new Map(eligible.map((e) => [e.productId, e]));

      for (const pId of ['P13', 'P14', 'P15']) {
        const item = eligibleMap.get(pId);
        expect(item.eligible).toBe(false);
        expect(item.reasons.some((r) => r.code === REASON_CODES.GSTIN_REQUIRED)).toBe(true);
      }
    });
  });

  describe('Golden Test 3: Multi-site Restaurant Chain (Active GSTIN)', () => {
    // 4 sites, 40 staff, Tier 1, Active GSTIN, cameras requested (2 per site = 8)
    const profile = {
      businessType: 'Restaurant chain',
      segment: 'multi',
      employeeCount: 40,
      numSites: 4,
      cityTier: 1,
      cameras: 8,
      hasGstin: true,
      gstin: { present: true, valid: true, status: 'Active' },
    };

    it('computes exact quote: 4 x P02 + 4 x P09 + 4 x P10 + 8 x P23 = ₹19,584/month, setup ₹40,400, contract 24 months, first-year ₹275,408 (indicativeOnly)', () => {
      const items = [
        { productId: 'P02', qty: 4 },
        { productId: 'P09', qty: 4 },
        { productId: 'P10', qty: 4 },
        { productId: 'P23', qty: 8 },
      ];

      const validation = validateBundle(items, profile, products);
      expect(validation.valid).toBe(true);

      const quote = computeQuote(items, products, 'min');
      expect(quote.monthlyTotal).toBe(19584);
      expect(quote.setupTotal).toBe(40400);
      expect(quote.contractMonths).toBe(24);
      expect(quote.firstYearTotal).toBe(275408);

      const { tiers } = buildBundles(profile, products, { mode: 'min' });
      const resilient = tiers.find((t) => t.tierLabel === 'resilient');
      expect(resilient.indicativeOnly).toBe(true);
      expect(resilient.monthlyTotal).toBe(19584);
      expect(resilient.setupTotal).toBe(40400);
      expect(resilient.contractMonths).toBe(24);
      expect(resilient.firstYearTotal).toBe(275408);
    });
  });

  describe('Golden Test 4: Multi-site Chain with Cancelled GSTIN', () => {
    const profileCancelled = {
      businessType: 'Restaurant chain',
      segment: 'multi',
      employeeCount: 40,
      numSites: 4,
      cityTier: 1,
      hasGstin: true,
      gstin: { present: true, valid: true, status: 'Cancelled' },
    };

    it('blocks P10 with GSTIN_NOT_ACTIVE', () => {
      const p10 = products.find((p) => p.productId === 'P10');
      const elig = checkProductEligibility(p10, profileCancelled);
      expect(elig.eligible).toBe(false);
      expect(elig.reasons.some((r) => r.code === REASON_CODES.GSTIN_NOT_ACTIVE)).toBe(true);
    });
  });

  describe('Golden Test 5: Negative & Edge Cases', () => {
    const baseProfile = {
      businessType: 'Dental clinic',
      segment: 'prof',
      employeeCount: 10,
      numSites: 1,
      cityTier: 1,
      hasGstin: true,
      gstin: { present: true, valid: true, status: 'Active' },
    };

    it('rejects P09 alone with DEPENDENCY_MISSING', () => {
      const res = validateBundle([{ productId: 'P09', qty: 1 }], baseProfile, products);
      expect(res.valid).toBe(false);
      expect(res.violations.some((v) => v.code === REASON_CODES.DEPENDENCY_MISSING)).toBe(true);
    });

    it('rejects P03 in a Tier 2 city with TIER_NOT_SERVED', () => {
      const p03 = products.find((p) => p.productId === 'P03');
      const elig = checkProductEligibility(p03, { ...baseProfile, cityTier: 2, employeeCount: 10 });
      expect(elig.eligible).toBe(false);
      expect(elig.reasons.some((r) => r.code === REASON_CODES.TIER_NOT_SERVED)).toBe(true);
    });

    it('rejects P03 with 4 staff with TOO_FEW_EMPLOYEES', () => {
      const p03 = products.find((p) => p.productId === 'P03');
      const elig = checkProductEligibility(p03, { ...baseProfile, cityTier: 1, employeeCount: 4 });
      expect(elig.eligible).toBe(false);
      expect(elig.reasons.some((r) => r.code === REASON_CODES.TOO_FEW_EMPLOYEES)).toBe(true);
    });

    it('rejects P05 with 9 staff with TOO_FEW_EMPLOYEES', () => {
      const p05 = products.find((p) => p.productId === 'P05');
      const elig = checkProductEligibility(p05, { ...baseProfile, employeeCount: 9 });
      expect(elig.eligible).toBe(false);
      expect(elig.reasons.some((r) => r.code === REASON_CODES.TOO_FEW_EMPLOYEES)).toBe(true);
    });

    it('rejects P10 with 2 sites with TOO_FEW_SITES', () => {
      const p10 = products.find((p) => p.productId === 'P10');
      const elig = checkProductEligibility(p10, { ...baseProfile, numSites: 2, employeeCount: 15 });
      expect(elig.eligible).toBe(false);
      expect(elig.reasons.some((r) => r.code === REASON_CODES.TOO_FEW_SITES)).toBe(true);
    });

    it('rejects P24 with 9 staff with TOO_FEW_EMPLOYEES', () => {
      const p24 = products.find((p) => p.productId === 'P24');
      const elig = checkProductEligibility(p24, { ...baseProfile, employeeCount: 9 });
      expect(elig.eligible).toBe(false);
      expect(elig.reasons.some((r) => r.code === REASON_CODES.TOO_FEW_EMPLOYEES)).toBe(true);
    });

    it('rejects quantities: 0, negative, 1.5, and string "3"', () => {
      const badQuantities = [0, -1, 1.5, '3', null, undefined, NaN];
      for (const badQty of badQuantities) {
        expect(() => {
          computeQuote([{ productId: 'P01', qty: badQty }], products);
        }).toThrow();

        const bundleValidation = validateBundle(
          [{ productId: 'P01', qty: badQty }],
          baseProfile,
          products
        );
        expect(bundleValidation.valid).toBe(false);
        expect(bundleValidation.violations.some((v) => v.code === REASON_CODES.BAD_QUANTITY)).toBe(
          true
        );
      }
    });
  });
});
