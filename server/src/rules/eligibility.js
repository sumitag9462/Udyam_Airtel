/**
 * Pure eligibility checks for products against a business profile.
 * No database, network, clock or randomness.
 */

export const REASON_CODES = Object.freeze({
  TIER_NOT_SERVED: 'TIER_NOT_SERVED',
  TIER_UNVERIFIED: 'TIER_UNVERIFIED',
  TOO_FEW_EMPLOYEES: 'TOO_FEW_EMPLOYEES',
  TOO_FEW_SITES: 'TOO_FEW_SITES',
  GSTIN_REQUIRED: 'GSTIN_REQUIRED',
  GSTIN_NOT_ACTIVE: 'GSTIN_NOT_ACTIVE',
  DEPENDENCY_MISSING: 'DEPENDENCY_MISSING',
  BAD_QUANTITY: 'BAD_QUANTITY',
});

/**
 * Check eligibility of a single product against a profile.
 * @param {object} product - Product catalogue entry
 * @param {object} profile - Business profile
 * @returns {{ eligible: boolean, reasons: Array<{ code: string, detail: string }> }}
 */
export function checkProductEligibility(product, profile) {
  const reasons = [];

  const employeeCount = Number(profile.employeeCount || 0);
  const numSites = Number(profile.numSites || 1);
  const cityTier =
    profile.cityTier !== undefined && profile.cityTier !== null ? Number(profile.cityTier) : null;

  // 1. City Tier check
  if (cityTier === null || isNaN(cityTier)) {
    reasons.push({
      code: REASON_CODES.TIER_UNVERIFIED,
      detail: `City tier is unverified; confirmation required before offering ${product.productName}`,
    });
  } else if (!product.availableCityTiers.includes(cityTier)) {
    reasons.push({
      code: REASON_CODES.TIER_NOT_SERVED,
      detail: `${product.productName} is available only in Tier ${product.availableCityTiers.join(', ')} cities (applicant is in Tier ${cityTier})`,
    });
  }

  // 2. Minimum employees check
  if (employeeCount < product.minEmployees) {
    reasons.push({
      code: REASON_CODES.TOO_FEW_EMPLOYEES,
      detail: `${product.productName} requires at least ${product.minEmployees} employees (profile has ${employeeCount})`,
    });
  }

  // 3. Minimum sites check
  if (numSites < product.minSites) {
    reasons.push({
      code: REASON_CODES.TOO_FEW_SITES,
      detail: `${product.productName} requires at least ${product.minSites} sites (profile has ${numSites})`,
    });
  }

  // 4. GSTIN requirement check
  if (product.requiresGstin) {
    const gstin = profile.gstin;
    const hasGstin = profile.hasGstin || (gstin && (gstin.present || gstin.status));

    if (!hasGstin || !gstin) {
      reasons.push({
        code: REASON_CODES.GSTIN_REQUIRED,
        detail: `${product.productName} requires an active GSTIN`,
      });
    } else {
      const status = typeof gstin === 'object' ? gstin.status : profile.gstinStatus;
      const isValid = typeof gstin === 'object' ? gstin.valid !== false : true;

      if (!isValid || status === 'Cancelled' || status === 'Suspended') {
        reasons.push({
          code: REASON_CODES.GSTIN_NOT_ACTIVE,
          detail: `${product.productName} requires an Active GSTIN (current status: ${status || 'Invalid'})`,
        });
      }
    }
  }

  return {
    eligible: reasons.length === 0,
    reasons,
  };
}

/**
 * Public API: Get eligibility results for all products against a profile.
 * @param {object} profile
 * @param {Array<object>} products
 * @param {object} [ctx]
 * @returns {Array<{ productId: string, eligible: boolean, reasons: Array<{ code: string, detail: string }> }>}
 */
export function getEligibleProducts(profile, products, _ctx = {}) {
  return products.map((product) => {
    const res = checkProductEligibility(product, profile);
    return {
      productId: product.productId,
      eligible: res.eligible,
      reasons: res.reasons,
    };
  });
}
