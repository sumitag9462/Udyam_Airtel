import path from 'node:path';
import { parseProductCatalogue } from '../../seed/parse.js';
import * as RulesIndex from '../../src/rules/index.js';
import {
  segmentOf,
  pricingFor,
  computeQuote,
  checkProductEligibility,
  buildBundles,
  explainRemoval,
  previewScenario,
  REASON_CODES,
} from '../../src/rules/index.js';

describe('Rules Engine: Branch & Line Coverage Suite', () => {
  const products = parseProductCatalogue(
    path.resolve(process.cwd(), '../data/product_catalogue.csv')
  );

  test('RulesIndex exports exist', () => {
    expect(RulesIndex.getEligibleProducts).toBeDefined();
    expect(RulesIndex.validateBundle).toBeDefined();
    expect(RulesIndex.buildBundles).toBeDefined();
    expect(RulesIndex.computeQuote).toBeDefined();
    expect(RulesIndex.explainRemoval).toBeDefined();
    expect(RulesIndex.previewScenario).toBeDefined();
    expect(RulesIndex.segmentOf).toBeDefined();
  });

  describe('segmentOf edge cases', () => {
    test('handles null, empty, non-string and unknown business types', () => {
      expect(segmentOf(null)).toBe('micro');
      expect(segmentOf('')).toBe('micro');
      expect(segmentOf(123)).toBe('micro');
      expect(segmentOf('Some Completely Unknown Business')).toBe('micro');
    });
  });

  describe('pricingFor modes and errors', () => {
    const sampleProduct = products.find((p) => p.productId === 'P01');

    test('supports min, mid, max pricing modes', () => {
      expect(pricingFor(sampleProduct, 'min')).toBe(999);
      expect(pricingFor(sampleProduct, 'mid')).toBe(1099);
      expect(pricingFor(sampleProduct, 'max')).toBe(1199);
      expect(pricingFor(sampleProduct, 'default')).toBe(999);
      expect(pricingFor(sampleProduct)).toBe(999);
    });

    test('computeQuote throws for unknown product', () => {
      expect(() => {
        computeQuote([{ productId: 'P99_INVALID', qty: 1 }], products);
      }).toThrow('UNKNOWN_PRODUCT');
    });

    test('computePriceHash default mode and computeQuote defaults', () => {
      expect(RulesIndex.computePriceHash([], 'v1')).toBeDefined();
      const dummyQuote = RulesIndex.computeQuote([], []);
      expect(dummyQuote.monthlyTotal).toBe(0);
      expect(dummyQuote.setupTotal).toBe(0);
    });
  });

  describe('eligibility.js edge cases', () => {
    const sampleProduct = products.find((p) => p.productId === 'P01');

    test('handles missing or unverified city tier', () => {
      const res = checkProductEligibility(sampleProduct, { cityTier: null });
      expect(res.eligible).toBe(false);
      expect(res.reasons[0].code).toBe(REASON_CODES.TIER_UNVERIFIED);

      const resUndef = checkProductEligibility(sampleProduct, {});
      expect(resUndef.eligible).toBe(false);
    });

    test('handles GSTIN variations (present only, status only, string)', () => {
      const gstinProduct = products.find((p) => p.productId === 'P03');

      // gstin object with present only
      const resPresentOnly = checkProductEligibility(gstinProduct, {
        cityTier: 1,
        employeeCount: 10,
        numSites: 1,
        hasGstin: false,
        gstin: { present: true, valid: true, status: 'Active' },
      });
      expect(resPresentOnly.eligible).toBe(true);

      // gstin object with status only
      const resStatusOnly = checkProductEligibility(gstinProduct, {
        cityTier: 1,
        employeeCount: 10,
        numSites: 1,
        hasGstin: false,
        gstin: { status: 'Active' },
      });
      expect(resStatusOnly.eligible).toBe(true);

      // string gstin
      const resString = checkProductEligibility(gstinProduct, {
        cityTier: 1,
        employeeCount: 10,
        numSites: 1,
        hasGstin: true,
        gstin: '32TTNXB7384T1ZW',
        gstinStatus: 'Active',
      });
      expect(resString.eligible).toBe(true);

      const resSuspended = checkProductEligibility(gstinProduct, {
        cityTier: 1,
        employeeCount: 10,
        numSites: 1,
        hasGstin: true,
        gstin: '32TTNXB7384T1ZW',
        gstinStatus: 'Suspended',
      });
      expect(resSuspended.eligible).toBe(false);
      expect(resSuspended.reasons[0].code).toBe(REASON_CODES.GSTIN_NOT_ACTIVE);

      const resInvalid = checkProductEligibility(gstinProduct, {
        cityTier: 1,
        employeeCount: 10,
        numSites: 1,
        hasGstin: true,
        gstin: { present: true, valid: false },
      });
      expect(resInvalid.eligible).toBe(false);
      expect(resInvalid.reasons[0].code).toBe(REASON_CODES.GSTIN_NOT_ACTIVE);
    });
  });

  describe('bundles.js branch coverage', () => {
    test('covers P02 selection when staff <= 20 but needSpeed is true', () => {
      const profile = {
        businessType: 'Dental clinic',
        segment: 'prof',
        cityTier: 1,
        employeeCount: 5,
        numSites: 1,
        needSpeed: true,
        hasGstin: true,
        gstin: { present: true, valid: true, status: 'Active' },
      };
      const res = buildBundles(profile, products);
      expect(res.tiers[0].lineItems.some((i) => i.productId === 'P02')).toBe(true);
    });

    test('covers P03 selection with needHighSpeed in multi segment', () => {
      const profile = {
        businessType: 'Restaurant chain',
        segment: 'multi',
        cityTier: 1,
        employeeCount: 30,
        numSites: 3,
        needHighSpeed: true,
        hasGstin: true,
        gstin: { present: true, valid: true, status: 'Active' },
      };
      const res = buildBundles(profile, products);
      expect(res.tiers.length).toBe(3);
    });

    test('covers shortfall when primary link is already P04', () => {
      const profile = {
        businessType: 'Kirana store',
        segment: 'micro',
        cityTier: 2,
        employeeCount: 2,
        numSites: 1,
        budgetMonthly: 500,
        hasGstin: false,
      };
      const res = buildBundles(profile, products);
      expect(res.shortfall).toBeDefined();
      expect(res.shortfall.gap).toBeGreaterThan(0);
      expect(res.shortfall.cheapestValidAlternative).toBeNull();
    });

    test('covers mfg segment with machine monitoring and P06 leased line', () => {
      const profile = {
        businessType: 'Auto-parts unit',
        segment: 'mfg',
        cityTier: 1,
        employeeCount: 30,
        numSites: 2,
        machines: 5,
        mustHaves: ['iot', 'backup_internet', 'security'],
        hasGstin: true,
        gstin: { present: true, valid: true, status: 'Active' },
      };
      const res = buildBundles(profile, products);
      expect(res.tiers.length).toBe(3);
      const resilient = res.tiers.find((t) => t.tierLabel === 'resilient');
      expect(resilient.lineItems.some((i) => i.productId === 'P24')).toBe(true);
    });

    test('covers mfg segment when machines requested but P24 is ineligible', () => {
      const profile = {
        businessType: 'Auto-parts unit',
        segment: 'mfg',
        cityTier: 1,
        employeeCount: 4, // P24 needs 10 staff
        numSites: 1,
        machines: 3,
        hasGstin: false,
      };
      const res = buildBundles(profile, products);
      expect(res.tiers.length).toBe(3);
      const resilient = res.tiers.find((t) => t.tierLabel === 'resilient');
      expect(resilient.lineItems.some((i) => i.productId === 'P24')).toBe(false);
    });

    test('covers all units in defaultQuantityFor', () => {
      expect(RulesIndex.defaultQuantityFor({ unit: 'per site' }, { numSites: 4 })).toBe(4);
      expect(RulesIndex.defaultQuantityFor({ unit: 'per user' }, { employeeCount: 12 })).toBe(12);
      expect(RulesIndex.defaultQuantityFor({ unit: 'per device' }, { devices: 7 })).toBe(7);
      expect(RulesIndex.defaultQuantityFor({ unit: 'per line' }, { mobileLines: 5 })).toBe(5);
      expect(RulesIndex.defaultQuantityFor({ unit: 'per vehicle' }, { vehicles: 3 })).toBe(3);
      expect(RulesIndex.defaultQuantityFor({ unit: 'per channel' }, { channels: 4 })).toBe(4);
      expect(RulesIndex.defaultQuantityFor({ unit: 'per counter' }, { counters: 2 })).toBe(2);
      expect(RulesIndex.defaultQuantityFor({ unit: 'per camera' }, { cameras: 5 })).toBe(5);
      expect(RulesIndex.defaultQuantityFor({ unit: 'unknown_unit' }, {})).toBe(1);
    });

    test('covers unknown product and multiple violations in validateBundle', () => {
      const res = RulesIndex.validateBundle(
        [{ productId: 'NON_EXISTENT', qty: 1 }],
        { cityTier: 1, employeeCount: 10, numSites: 1 },
        products
      );
      expect(res.valid).toBe(false);
      expect(res.violations[0].code).toBe('UNKNOWN_PRODUCT');

      const resMulti = RulesIndex.validateBundle(
        [{ productId: 'P03', qty: 1 }],
        { cityTier: 2, employeeCount: 2, numSites: 1, hasGstin: false },
        products
      );
      expect(resMulti.valid).toBe(false);
      expect(resMulti.violations.length).toBeGreaterThan(1);
    });
  });

  describe('scenarios.js branch coverage', () => {
    test('explainRemoval when non-primary link is removed with multiple primary links', () => {
      const quote = computeQuote(
        [
          { productId: 'P01', qty: 1 },
          { productId: 'P02', qty: 1 },
          { productId: 'P09', qty: 1 },
        ],
        products
      );
      const res = explainRemoval(quote, 'P01');
      expect(res.breaksDependencies).toEqual([]);
    });

    test('explainRemoval handles custom or unknown product capabilities', () => {
      const customQuote = {
        lineItems: [{ productId: 'CUSTOM_P', name: 'Custom Tool', lineMonthly: 500, lineSetup: 0 }],
      };
      const res = explainRemoval(customQuote, 'CUSTOM_P');
      expect(res.losesCapabilities[0]).toContain('Functionality provided by Custom Tool');
    });

    test('budget_cut scenario when no primary link in quote and when items fit budget', () => {
      const quote = computeQuote(
        [
          { productId: 'P16', qty: 2 },
          { productId: 'P17', qty: 1 },
        ],
        products
      );
      const res = previewScenario(quote, 'budget_cut', {}, products);
      expect(res.newMonthly).toBeDefined();
    });

    test('second_site with empty profile and non-per-site items', () => {
      const mixedQuote = computeQuote(
        [
          { productId: 'P01', qty: 1 }, // per site
          { productId: 'P16', qty: 5 }, // per user
        ],
        products
      );
      const res = previewScenario(mixedQuote, 'second_site', {}, products);
      expect(res.newSites).toBe(2);
      expect(res.newMonthly).toBe(999 * 2 + 125 * 5);
    });
  });
});
