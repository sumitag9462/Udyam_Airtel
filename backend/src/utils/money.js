/**
 * Money formatting utilities.
 * All prices are integer rupees.
 */

const inrFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

/**
 * Format an integer amount as INR (e.g., ₹1,23,456).
 * @param {number} amount - Integer rupees
 * @returns {string}
 */
export function formatInr(amount) {
  return inrFormatter.format(amount);
}

/**
 * Parse a string or number to an integer rupee amount.
 * Throws if the value is not a valid integer.
 * @param {number|string} value
 * @returns {number}
 */
export function toIntegerRupees(value) {
  const num = typeof value === 'string' ? Number(value) : value;
  if (!Number.isInteger(num)) {
    throw new Error(`Invalid rupee amount: ${value} (must be an integer)`);
  }
  return num;
}
