import path from 'node:path';
import { parseProductCatalogue } from '../../seed/parse.js';
import { computeQuote, explainRemoval, previewScenario } from '../../src/rules/index.js';

describe('Rules Engine: Scenarios and Explanations (Section 9.6)', () => {
  const products = parseProductCatalogue(
    path.resolve(process.cwd(), '../data/product_catalogue.csv')
  );

  const quote = computeQuote(
    [
      { productId: 'P01', qty: 1 },
      { productId: 'P16', qty: 10 },
      { productId: 'P09', qty: 1 },
    ],
    products,
    'min'
  );

  describe('explainRemoval', () => {
    it('explains removal of failover P09 with exact savings', () => {
      const res = explainRemoval(quote, 'P09');
      expect(res.savingMonthly).toBe(499);
      expect(res.savingSetup).toBe(1500);
      expect(res.losesCapabilities.length).toBeGreaterThan(0);
      expect(res.breaksDependencies).toEqual([]);
    });

    it('warns about breaking dependencies when removing the primary link', () => {
      const res = explainRemoval(quote, 'P01');
      expect(res.savingMonthly).toBe(999);
      expect(res.breaksDependencies.length).toBeGreaterThan(0);
      expect(res.breaksDependencies[0]).toContain('requires a primary link');
    });

    it('handles product not in quote gracefully', () => {
      const res = explainRemoval(quote, 'P25');
      expect(res.savingMonthly).toBe(0);
      expect(res.losesCapabilities).toEqual([]);
    });
  });

  describe('previewScenario', () => {
    it('previews link_failure scenario accurately', () => {
      const withFailover = previewScenario(quote, 'link_failure');
      expect(withFailover.hasProtection).toBe(true);
      expect(withFailover.summary).toContain('P09');
      expect(withFailover.disclaimer).toBeDefined();

      const quoteNoFailover = computeQuote([{ productId: 'P01', qty: 1 }], products);
      const withoutFailover = previewScenario(quoteNoFailover, 'link_failure');
      expect(withoutFailover.hasProtection).toBe(false);
      expect(withoutFailover.summary).toContain('offline');
    });

    it('previews budget_cut scenario with lower monthly and listed items given up', () => {
      const res = previewScenario(quote, 'budget_cut', {}, products);
      expect(res.newMonthly).toBeLessThan(res.originalMonthly);
      expect(res.deltaMonthly).toBe(res.originalMonthly - res.newMonthly);
      expect(res.disclaimer).toBeDefined();
    });

    it('previews second_site scenario by increasing per-site quantities', () => {
      const res = previewScenario(quote, 'second_site', { numSites: 1 }, products);
      expect(res.newSites).toBe(2);
      expect(res.newMonthly).toBeGreaterThan(res.originalMonthly);
      // P01 (999 * 2) + P16 (125 * 10) + P09 (499 * 2) = 1998 + 1250 + 998 = 4246
      expect(res.newMonthly).toBe(4246);
    });

    it('throws on unknown scenario name', () => {
      expect(() => {
        previewScenario(quote, 'invalid_scenario_xyz');
      }).toThrow('Unknown preview scenario');
    });
  });
});
