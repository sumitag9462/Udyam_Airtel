import fc from 'fast-check';
import path from 'node:path';
import { parseProductCatalogue } from '../../seed/parse.js';
import {
  buildBundles,
  validateBundle,
  checkProductEligibility,
  BUSINESS_TYPE_TO_SEGMENT,
} from '../../src/rules/index.js';

describe('Rules Engine: Property-Based Tests (fast-check)', () => {
  const products = parseProductCatalogue(
    path.resolve(process.cwd(), '../data/product_catalogue.csv')
  );

  const businessTypes = Object.keys(BUSINESS_TYPE_TO_SEGMENT);

  const profileArbitrary = fc.record({
    businessType: fc.constantFrom(...businessTypes),
    employeeCount: fc.integer({ min: 1, max: 150 }),
    numSites: fc.integer({ min: 1, max: 12 }),
    cityTier: fc.constantFrom(1, 2),
    hasGstin: fc.boolean(),
    gstinStatus: fc.constantFrom('Active', 'Cancelled', 'Suspended'),
    budgetMonthly: fc.option(fc.integer({ min: 500, max: 100000 }), { nil: null }),
    mustHaves: fc.subarray([
      'backup_internet',
      'cloud_backup',
      'email',
      'security',
      'cctv',
      'pos',
      'whatsapp',
      'phone_lines',
      'static_ip',
      'website',
    ]),
  });

  it('Property: monthly total always equals sum of line items', () => {
    fc.assert(
      fc.property(profileArbitrary, (rawProfile) => {
        const profile = {
          ...rawProfile,
          gstin: rawProfile.hasGstin
            ? { present: true, valid: true, status: rawProfile.gstinStatus }
            : null,
        };

        const { tiers } = buildBundles(profile, products, { mode: 'min' });
        for (const tier of tiers) {
          const sumLines = tier.lineItems.reduce((acc, item) => acc + item.lineMonthly, 0);
          expect(tier.monthlyTotal).toBe(sumLines);

          const sumSetup = tier.lineItems.reduce((acc, item) => acc + item.lineSetup, 0);
          expect(tier.setupTotal).toBe(sumSetup);

          expect(tier.firstYearTotal).toBe(12 * tier.monthlyTotal + tier.setupTotal);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('Property: no returned bundle contains an ineligible item', () => {
    fc.assert(
      fc.property(profileArbitrary, (rawProfile) => {
        const profile = {
          ...rawProfile,
          gstin: rawProfile.hasGstin
            ? { present: true, valid: true, status: rawProfile.gstinStatus }
            : null,
        };

        const { tiers } = buildBundles(profile, products, { mode: 'min' });
        for (const tier of tiers) {
          for (const item of tier.lineItems) {
            const product = products.find((p) => p.productId === item.productId);
            const elig = checkProductEligibility(product, profile);
            expect(elig.eligible).toBe(true);
          }
        }
      }),
      { numRuns: 100 }
    );
  });

  it('Property: all dependencies (requiresOneOf) are satisfied in every returned tier', () => {
    fc.assert(
      fc.property(profileArbitrary, (rawProfile) => {
        const profile = {
          ...rawProfile,
          gstin: rawProfile.hasGstin
            ? { present: true, valid: true, status: rawProfile.gstinStatus }
            : null,
        };

        const { tiers } = buildBundles(profile, products, { mode: 'min' });
        for (const tier of tiers) {
          const validation = validateBundle(tier.lineItems, profile, products);
          expect(validation.valid).toBe(true);
          expect(validation.violations).toEqual([]);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('Property: tiers are monotonic (Starter <= Standard <= Resilient)', () => {
    fc.assert(
      fc.property(profileArbitrary, (rawProfile) => {
        const profile = {
          ...rawProfile,
          gstin: rawProfile.hasGstin
            ? { present: true, valid: true, status: rawProfile.gstinStatus }
            : null,
        };

        const { tiers, shortfall } = buildBundles(profile, products, { mode: 'min' });
        if (!shortfall && tiers.length === 3) {
          const [starter, standard, resilient] = tiers;
          expect(starter.monthlyTotal).toBeLessThanOrEqual(standard.monthlyTotal);
          expect(standard.monthlyTotal).toBeLessThanOrEqual(resilient.monthlyTotal);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('Property: output is deterministic for identical input', () => {
    fc.assert(
      fc.property(profileArbitrary, (rawProfile) => {
        const profile = {
          ...rawProfile,
          gstin: rawProfile.hasGstin
            ? { present: true, valid: true, status: rawProfile.gstinStatus }
            : null,
        };

        const run1 = buildBundles(profile, products, { mode: 'min' });
        const run2 = buildBundles(profile, products, { mode: 'min' });

        expect(run1).toEqual(run2);
      }),
      { numRuns: 50 }
    );
  });
});
