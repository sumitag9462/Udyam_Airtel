import crypto from 'node:crypto';

/**
 * Determine unit price based on pricing mode (min, mid, max).
 * Defaults to catalogue minimum.
 * @param {object} product
 * @param {'min'|'mid'|'max'} [mode='min']
 * @returns {number}
 */
export function pricingFor(product, mode = 'min') {
  if (mode === 'max') {
    return product.priceMaxInrPerMonth;
  }
  if (mode === 'mid') {
    return Math.round((product.priceMinInrPerMonth + product.priceMaxInrPerMonth) / 2);
  }
  return product.priceMinInrPerMonth;
}

/**
 * Compute sha256 priceHash from sorted line items, rulesVersion, and pricingMode.
 * @param {Array<object>} lineItems
 * @param {string} rulesVersion
 * @param {string} pricingMode
 * @returns {string}
 */
export function computePriceHash(lineItems, rulesVersion, pricingMode = 'min') {
  const sorted = [...lineItems]
    .map((item) => ({
      productId: item.productId,
      qty: item.qty,
      unitPrice: item.unitPrice,
      setupFee: item.setupFee,
    }))
    .sort((a, b) => a.productId.localeCompare(b.productId));

  const payload = JSON.stringify({ items: sorted, rulesVersion, pricingMode });
  return crypto.createHash('sha256').update(payload).digest('hex');
}

/**
 * Validate item quantity.
 * @param {any} qty
 * @returns {boolean}
 */
export function isValidQuantity(qty) {
  return typeof qty === 'number' && Number.isInteger(qty) && qty > 0;
}

/**
 * Compute quote totals and line items from raw item selections.
 * @param {Array<{ productId: string, qty: number }>} lineItems
 * @param {Array<object>} products
 * @param {'min'|'mid'|'max'} [mode='min']
 * @returns {{ lineItems: Array<object>, monthlyTotal: number, setupTotal: number, contractMonths: number, firstYearTotal: number, priceHash: string }}
 */
export function computeQuote(lineItems, products, mode = 'min') {
  const productMap = new Map(products.map((p) => [p.productId, p]));
  const computedLines = [];

  let monthlyTotal = 0;
  let setupTotal = 0;
  let maxContractMonths = 12; // Base contract floor

  for (const item of lineItems) {
    if (!isValidQuantity(item.qty)) {
      throw new Error(
        `BAD_QUANTITY: Quantity for product ${item.productId} must be a positive integer`
      );
    }

    const product = productMap.get(item.productId);
    if (!product) {
      throw new Error(`UNKNOWN_PRODUCT: Product ${item.productId} not found in catalogue`);
    }

    const unitPrice = pricingFor(product, mode);
    const setupFee = product.oneTimeSetupInr;

    const lineMonthly = unitPrice * item.qty;
    const lineSetup = setupFee * item.qty;

    monthlyTotal += lineMonthly;
    setupTotal += lineSetup;

    if (product.minContractMonths > maxContractMonths) {
      maxContractMonths = product.minContractMonths;
    }

    computedLines.push({
      productId: product.productId,
      name: product.productName,
      unit: product.unit,
      qty: item.qty,
      unitPrice,
      setupFee,
      lineMonthly,
      lineSetup,
    });
  }

  const firstYearTotal = 12 * monthlyTotal + setupTotal;
  const rulesVersion = products[0]?.rulesVersion || '1.0';
  const priceHash = computePriceHash(computedLines, rulesVersion, mode);

  return {
    lineItems: computedLines,
    monthlyTotal,
    setupTotal,
    contractMonths: maxContractMonths,
    firstYearTotal,
    priceHash,
  };
}
