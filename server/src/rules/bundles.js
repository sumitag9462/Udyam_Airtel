import { checkProductEligibility, REASON_CODES } from './eligibility.js';
import { computeQuote, isValidQuantity } from './pricing.js';
import { segmentOf } from './segment.js';

/**
 * Mapping from must-have capability keys to product IDs
 */
export const MUST_HAVE_PRODUCT_MAP = Object.freeze({
  backup_internet: 'P09',
  cloud_backup: 'P17',
  email: 'P16',
  security: 'P20', // Default endpoint security; P21 Managed Firewall for mfg/multi if eligible
  cctv: 'P23',
  pos: 'P19',
  whatsapp: 'P15',
  phone_lines: 'P07',
  static_ip: 'P11',
  website: 'P18',
});

/**
 * Determine default quantity for a product given a profile.
 * @param {object} product
 * @param {object} profile
 * @returns {number}
 */
export function defaultQuantityFor(product, profile) {
  const numSites = Math.max(1, Number(profile.numSites || 1));
  const employeeCount = Math.max(1, Number(profile.employeeCount || 1));

  switch (product.unit) {
    case 'per site':
      return numSites;
    case 'per user':
      return employeeCount;
    case 'per device':
      return Number(profile.devices) || employeeCount;
    case 'per line':
      return Math.max(1, Number(profile.mobileLines) || 1);
    case 'per camera':
      return Number(profile.cameras) || 1;
    case 'per vehicle':
      return Number(profile.vehicles) || 1;
    case 'per channel':
      return Number(profile.channels) || 1;
    case 'per counter':
      return Number(profile.counters) || 1;
    case 'per account':
    case 'per pack':
    case 'per number':
    case 'per IP':
    default:
      return 1;
  }
}

/**
 * Public API: Validate a bundle of line items against a business profile and product catalogue.
 * @param {Array<{ productId: string, qty: number }>} lineItems
 * @param {object} profile
 * @param {Array<object>} products
 * @returns {{ valid: boolean, violations: Array<{ code: string, productId: string, detail: string }> }}
 */
export function validateBundle(lineItems, profile, products) {
  const violations = [];
  const productMap = new Map(products.map((p) => [p.productId, p]));
  const bundleProductIds = new Set(lineItems.map((item) => item.productId));

  for (const item of lineItems) {
    // 1. Quantity validation
    if (!isValidQuantity(item.qty)) {
      violations.push({
        code: REASON_CODES.BAD_QUANTITY,
        productId: item.productId,
        detail: `Quantity must be a positive integer (got ${item.qty})`,
      });
      continue;
    }

    const product = productMap.get(item.productId);
    if (!product) {
      violations.push({
        code: 'UNKNOWN_PRODUCT',
        productId: item.productId,
        detail: `Product ${item.productId} not found in catalogue`,
      });
      continue;
    }

    // 2. Eligibility validation
    const eligibility = checkProductEligibility(product, profile);
    if (!eligibility.eligible) {
      for (const reason of eligibility.reasons) {
        violations.push({
          code: reason.code,
          productId: item.productId,
          detail: reason.detail,
        });
      }
    }

    // 3. Dependency validation (requiresOneOf)
    if (product.requiresOneOf && product.requiresOneOf.length > 0) {
      const hasDependency = product.requiresOneOf.some((depId) => bundleProductIds.has(depId));
      if (!hasDependency) {
        violations.push({
          code: REASON_CODES.DEPENDENCY_MISSING,
          productId: item.productId,
          detail: `${product.productName} requires one of: ${product.requiresOneOf.join(', ')} in the same bundle`,
        });
      }
    }
  }

  return {
    valid: violations.length === 0,
    violations,
  };
}

/**
 * Choose the primary broadband / leased link based on profile.
 */
function selectPrimaryLink(profile, productMap) {
  const segment = profile.segment || segmentOf(profile.businessType);
  const employeeCount = Number(profile.employeeCount || 1);
  const budget = profile.budgetMonthly ? Number(profile.budgetMonthly) : null;
  const cityTier = Number(profile.cityTier);

  // If budget is very tight (e.g. <= 1500) and AirFiber is requested or fibre not essential:
  if (budget !== null && budget <= 1500 && segment === 'micro') {
    const airfiber = productMap.get('P04');
    if (airfiber && checkProductEligibility(airfiber, profile).eligible) {
      return 'P04';
    }
  }

  // Leased lines for large manufacturers
  if (segment === 'mfg' && employeeCount >= 25) {
    const p06 = productMap.get('P06');
    if (p06 && checkProductEligibility(p06, profile).eligible) return 'P06';
  }
  if (segment === 'mfg' && employeeCount >= 10) {
    const p05 = productMap.get('P05');
    if (p05 && checkProductEligibility(p05, profile).eligible) return 'P05';
  }

  // 1 Gbps fibre for Tier 1 multi/mfg if eligible
  if ((segment === 'multi' || segment === 'mfg') && cityTier === 1 && employeeCount >= 5) {
    const p03 = productMap.get('P03');
    if (p03 && checkProductEligibility(p03, profile).eligible && profile.needHighSpeed) {
      return 'P03';
    }
  }

  // Fibre 300 if staff > 20 or speed needed or multi-site
  if (employeeCount > 20 || segment === 'multi' || profile.needSpeed) {
    const p02 = productMap.get('P02');
    if (p02 && checkProductEligibility(p02, profile).eligible) return 'P02';
  }

  // Default Fibre 100
  return 'P01';
}

/**
 * Public API: Build Starter, Standard, Resilient bundles or return shortfall.
 * @param {object} profile
 * @param {Array<object>} products
 * @param {object} [opts]
 * @returns {{ tiers: Array<object>, shortfall: object|null }}
 */
export function buildBundles(profile, products, opts = {}) {
  const mode = opts.mode || 'min';
  const productMap = new Map(products.map((p) => [p.productId, p]));
  const segment = profile.segment || segmentOf(profile.businessType);
  const numSites = Math.max(1, Number(profile.numSites || 1));
  const employeeCount = Math.max(1, Number(profile.employeeCount || 1));
  const mustHaves = Array.isArray(profile.mustHaves) ? profile.mustHaves : [];
  const budgetMonthly = profile.budgetMonthly ? Number(profile.budgetMonthly) : null;

  // 1. Choose primary link
  const primaryId = selectPrimaryLink(profile, productMap);
  const primaryQty = numSites;

  // Track essentials: primary link + eligible must-haves
  const essentialItems = [{ productId: primaryId, qty: primaryQty }];
  const ineligibleMustHaves = [];

  for (const mh of mustHaves) {
    let pId = MUST_HAVE_PRODUCT_MAP[mh];
    if (mh === 'security' && (segment === 'mfg' || segment === 'multi')) {
      const p21 = productMap.get('P21');
      if (p21 && checkProductEligibility(p21, profile).eligible) {
        pId = 'P21';
      }
    }
    if (pId && !essentialItems.some((i) => i.productId === pId)) {
      const p = productMap.get(pId);
      if (p && checkProductEligibility(p, profile).eligible) {
        essentialItems.push({ productId: pId, qty: defaultQuantityFor(p, profile) });
      } else if (p) {
        const elig = checkProductEligibility(p, profile);
        ineligibleMustHaves.push({
          mustHave: mh,
          productId: pId,
          code: elig.reasons[0]?.code,
          detail: elig.reasons[0]?.detail,
        });
      }
    }
  }

  // Check budget shortfall for essentials
  const essentialsQuote = computeQuote(essentialItems, products, mode);
  if (budgetMonthly !== null && essentialsQuote.monthlyTotal > budgetMonthly) {
    // Cannot afford essentials
    let cheapestValidAlternative = null;
    if (primaryId !== 'P04') {
      const altAirfiber = productMap.get('P04');
      if (altAirfiber && checkProductEligibility(altAirfiber, profile).eligible) {
        const altItems = [{ productId: 'P04', qty: primaryQty }, ...essentialItems.slice(1)];
        cheapestValidAlternative = computeQuote(altItems, products, mode);
      }
    }

    return {
      tiers: [],
      shortfall: {
        essentialsMonthly: essentialsQuote.monthlyTotal,
        budget: budgetMonthly,
        gap: essentialsQuote.monthlyTotal - budgetMonthly,
        cheapestValidAlternative: cheapestValidAlternative
          ? {
              monthlyTotal: cheapestValidAlternative.monthlyTotal,
              lineItems: cheapestValidAlternative.lineItems,
            }
          : null,
        ineligibleMustHaves,
      },
    };
  }

  // 2. Build Tiers by Segment Template
  let starterItems = [];
  let standardItems = [];
  let resilientItems = [];

  switch (segment) {
    case 'prof': {
      // Starter: Primary link + email for all staff
      starterItems = [
        { productId: primaryId, qty: primaryQty },
        { productId: 'P16', qty: employeeCount },
      ];

      // Standard: Starter + endpoint security (P20) + cloud backup (P17)
      standardItems = [
        ...starterItems,
        { productId: 'P20', qty: employeeCount },
        { productId: 'P17', qty: 1 },
      ];

      // Resilient: Standard + failover (P09)
      resilientItems = [...standardItems, { productId: 'P09', qty: numSites }];
      break;
    }

    case 'micro': {
      // Starter: P04 or P01 + POS (P19)
      starterItems = [
        { productId: primaryId, qty: primaryQty },
        { productId: 'P19', qty: 1 },
      ];

      // Standard: Starter + Secure Wi-Fi (P22) + WhatsApp Business (P15 if GSTIN active)
      const standardAdditions = [{ productId: 'P22', qty: numSites }];
      const p15 = productMap.get('P15');
      if (p15 && checkProductEligibility(p15, profile).eligible) {
        standardAdditions.push({ productId: 'P15', qty: 1 });
      }
      standardItems = [...starterItems, ...standardAdditions];

      // Resilient: Standard + failover (P09) + CCTV if requested
      const resilientAdditions = [{ productId: 'P09', qty: numSites }];
      if (profile.cameras || mustHaves.includes('cctv')) {
        resilientAdditions.push({ productId: 'P23', qty: Number(profile.cameras) || 1 });
      }
      resilientItems = [...standardItems, ...resilientAdditions];
      break;
    }

    case 'multi': {
      // Multi-site: per-site P02 + P09
      starterItems = [
        { productId: primaryId, qty: numSites },
        { productId: 'P09', qty: numSites },
      ];

      standardItems = [...starterItems];
      if (numSites >= 3) {
        const p10 = productMap.get('P10');
        if (p10 && checkProductEligibility(p10, profile).eligible) {
          standardItems.push({ productId: 'P10', qty: numSites });
        }
      }

      resilientItems = [...standardItems];
      if (profile.cameras || mustHaves.includes('cctv')) {
        const totalCameras = Number(profile.cameras) || numSites * 2;
        resilientItems.push({ productId: 'P23', qty: totalCameras });
      }
      break;
    }

    case 'mfg': {
      // Manufacturers: P02/P03/P05 + Firewall (P21) + Static IP (P11)
      starterItems = [{ productId: primaryId, qty: numSites }];

      const p21 = productMap.get('P21');
      const p11 = productMap.get('P11');

      standardItems = [...starterItems];
      if (p21 && checkProductEligibility(p21, profile).eligible) {
        standardItems.push({ productId: 'P21', qty: numSites });
      }
      if (
        p11 &&
        checkProductEligibility(p11, profile).eligible &&
        ['P01', 'P02', 'P03'].includes(primaryId)
      ) {
        standardItems.push({ productId: 'P11', qty: 1 });
      }

      resilientItems = [...standardItems, { productId: 'P09', qty: numSites }];
      if (profile.machines || mustHaves.includes('iot')) {
        const p24 = productMap.get('P24');
        if (p24 && checkProductEligibility(p24, profile).eligible) {
          resilientItems.push({ productId: 'P24', qty: Number(profile.machines) || 1 });
        }
      }
      break;
    }
  }

  // Merge in any other eligible must-haves that aren't already included
  function mergeMustHaves(items) {
    const res = [...items];
    const currentIds = new Set(res.map((i) => i.productId));
    for (const essential of essentialItems) {
      if (!currentIds.has(essential.productId)) {
        const prod = productMap.get(essential.productId);
        if (
          !prod.requiresOneOf ||
          prod.requiresOneOf.length === 0 ||
          prod.requiresOneOf.some((dep) => currentIds.has(dep))
        ) {
          res.push(essential);
          currentIds.add(essential.productId);
        }
      }
    }
    return res;
  }

  starterItems = mergeMustHaves(starterItems);
  standardItems = mergeMustHaves(standardItems);
  resilientItems = mergeMustHaves(resilientItems);

  // Filter out any items that are not eligible (fail-safe)
  function filterEligible(items) {
    return items.filter((item) => {
      const p = productMap.get(item.productId);
      return p && checkProductEligibility(p, profile).eligible;
    });
  }

  starterItems = filterEligible(starterItems);
  standardItems = filterEligible(standardItems);
  resilientItems = filterEligible(resilientItems);

  // Compute full quote objects
  const starterQuote = computeQuote(starterItems, products, mode);
  const standardQuote = computeQuote(standardItems, products, mode);
  const resilientQuote = computeQuote(resilientItems, products, mode);

  const isIndicativeOnly = segment === 'multi' || segment === 'mfg';

  const tiers = [
    {
      tierLabel: 'starter',
      name: 'Starter',
      indicativeOnly: isIndicativeOnly,
      ...starterQuote,
    },
    {
      tierLabel: 'standard',
      name: 'Standard',
      indicativeOnly: isIndicativeOnly,
      ...standardQuote,
    },
    {
      tierLabel: 'resilient',
      name: 'Resilient',
      indicativeOnly: isIndicativeOnly,
      ...resilientQuote,
    },
  ];

  return {
    tiers,
    shortfall: null,
    ineligibleMustHaves,
  };
}
