import { computeQuote } from './pricing.js';

/**
 * Capability description map for products
 */
export const PRODUCT_CAPABILITIES = Object.freeze({
  P01: '100 Mbps primary business broadband connectivity',
  P02: '300 Mbps high-speed primary fibre connectivity',
  P03: '1 Gbps ultra-fast gigabit fibre connectivity',
  P04: '100 Mbps wireless 5G business broadband connectivity',
  P05: '20 Mbps 1:1 dedicated leased line with 99.9% uptime SLA',
  P06: '100 Mbps 1:1 dedicated leased line with 99.9% uptime SLA',
  P07: 'Business mobile voice & data connection (299 plan)',
  P08: 'Business mobile voice & data connection with roaming (599 plan)',
  P09: 'Automatic 4G/5G mobile backup failover during fibre link cuts',
  P10: 'Multi-site intelligent traffic routing and network management',
  P11: 'Dedicated public static IP for remote access and on-premise hosting',
  P12: 'Virtual cloud PBX and interactive voice response (IVR)',
  P13: '1800 national toll-free customer inbound calling line',
  P14: '10,000 promotional and transactional business SMS package',
  P15: 'Official WhatsApp Business API integration and messaging chatbot',
  P16: 'Professional domain-based corporate email and cloud office suite',
  P17: 'Secure 1 TB automated cloud backup for files and databases',
  P18: 'Custom business domain name and starter professional website',
  P19: 'Cloud-synced point-of-sale billing and inventory management',
  P20: 'Antivirus, anti-ransomware, and centralized endpoint protection',
  P21: 'Enterprise perimeter security, intrusion detection, and firewall',
  P22: 'Separated enterprise Wi-Fi with isolated public guest network',
  P23: 'Cloud-recorded CCTV video surveillance with smartphone viewing',
  P24: 'Industrial telemetry and continuous IoT machine monitoring',
  P25: 'Real-time GPS vehicle location tracking and fleet analytics',
});

/**
 * Explain the impact of removing a product from a quote.
 * @param {object} quote - Computed quote object
 * @param {string} productId - Product to remove
 * @param {object} profile - Business profile
 * @returns {{ savingMonthly: number, savingSetup: number, losesCapabilities: Array<string>, breaksDependencies: Array<string> }}
 */
export function explainRemoval(quote, productId, _profile = {}) {
  const item = quote.lineItems.find((i) => i.productId === productId);
  if (!item) {
    return {
      savingMonthly: 0,
      savingSetup: 0,
      losesCapabilities: [],
      breaksDependencies: [],
    };
  }

  const savingMonthly = item.lineMonthly;
  const savingSetup = item.lineSetup;

  const losesCapabilities = [
    PRODUCT_CAPABILITIES[productId] || `Functionality provided by ${item.name}`,
  ];

  // Check what products depend on this product
  const remainingIds = new Set(
    quote.lineItems.filter((i) => i.productId !== productId).map((i) => i.productId)
  );

  const breaksDependencies = [];
  const primaryLinks = ['P01', 'P02', 'P03', 'P04', 'P05', 'P06'];

  if (primaryLinks.includes(productId)) {
    const hasOtherPrimary = primaryLinks.some((id) => remainingIds.has(id));
    if (!hasOtherPrimary) {
      for (const remaining of quote.lineItems) {
        if (remaining.productId !== productId) {
          if (['P09', 'P10', 'P11', 'P21', 'P22', 'P23'].includes(remaining.productId)) {
            breaksDependencies.push(
              `${remaining.name} (${remaining.productId}) requires a primary link in the bundle`
            );
          }
        }
      }
    }
  }

  return {
    savingMonthly,
    savingSetup,
    losesCapabilities,
    breaksDependencies,
  };
}

/**
 * Preview business impact scenarios (rule-based only, no performance guarantees).
 * Scenarios:
 * 1. 'link_failure': explains failover protection
 * 2. 'budget_cut': recalculates quote with reduced budget
 * 3. 'second_site': recalculates quote with an additional branch site
 *
 * @param {object} quote - Existing computed quote
 * @param {'link_failure'|'budget_cut'|'second_site'} scenario
 * @param {object} profile - Business profile
 * @param {Array<object>} products - Catalogue
 * @returns {object}
 */
export function previewScenario(quote, scenario, profile = {}, products = []) {
  switch (scenario) {
    case 'link_failure': {
      const hasFailover = quote.lineItems.some((i) => i.productId === 'P09');
      return {
        scenario: 'link_failure',
        hasProtection: hasFailover,
        summary: hasFailover
          ? 'Backup 4G/5G failover (P09) is included. In the event of an external fibre cut or local disruption, traffic automatically switches to the cellular network, provided mobile signal coverage, power, and router configuration permit.'
          : 'No automatic failover (P09) is present in this plan. If the primary fibre link is interrupted, your business connectivity will go offline until physical line restoration is completed.',
        disclaimer:
          'Estimated continuity based on rule simulation. No performance or activation speed guarantees.',
      };
    }

    case 'budget_cut': {
      const currentMonthly = quote.monthlyTotal;
      // Propose a 20% budget reduction
      const targetBudget = Math.floor(currentMonthly * 0.8);
      const itemsToKeep = [];
      let total = 0;

      // Keep primary links first
      const primaryLinks = ['P01', 'P02', 'P03', 'P04', 'P05', 'P06'];
      for (const item of quote.lineItems) {
        if (primaryLinks.includes(item.productId)) {
          itemsToKeep.push({ productId: item.productId, qty: item.qty });
          total += item.lineMonthly;
          break;
        }
      }

      const givenUpItems = [];
      for (const item of quote.lineItems) {
        if (itemsToKeep.some((k) => k.productId === item.productId)) continue;
        if (total + item.lineMonthly <= targetBudget) {
          itemsToKeep.push({ productId: item.productId, qty: item.qty });
          total += item.lineMonthly;
        } else {
          givenUpItems.push({
            productId: item.productId,
            name: item.name,
            monthlySaving: item.lineMonthly,
          });
        }
      }

      const newQuote = computeQuote(itemsToKeep, products, quote.pricingMode || 'min');

      return {
        scenario: 'budget_cut',
        originalMonthly: currentMonthly,
        newMonthly: newQuote.monthlyTotal,
        deltaMonthly: currentMonthly - newQuote.monthlyTotal,
        givenUpItems,
        newQuote,
        disclaimer: 'Catalogue minimum pricing before applicable taxes. Subject to approval.',
      };
    }

    case 'second_site': {
      const currentSites = Number(profile.numSites || 1);
      const newSites = currentSites + 1;

      // Scale per-site products
      const newItems = quote.lineItems.map((item) => {
        if (item.unit === 'per site') {
          return {
            productId: item.productId,
            qty: newSites,
          };
        }
        return {
          productId: item.productId,
          qty: item.qty,
        };
      });

      const newQuote = computeQuote(newItems, products, quote.pricingMode || 'min');

      return {
        scenario: 'second_site',
        originalSites: currentSites,
        newSites,
        originalMonthly: quote.monthlyTotal,
        newMonthly: newQuote.monthlyTotal,
        originalSetup: quote.setupTotal,
        newSetup: newQuote.setupTotal,
        newQuote,
        disclaimer:
          'Per-site products multiplied by site count. Serviceability verified per address.',
      };
    }

    default:
      throw new Error(`Unknown preview scenario: ${scenario}`);
  }
}
