/**
 * Date utilities for KYC and general use.
 */

/**
 * Parse a date from various formats:
 * - dd/mm/yyyy
 * - dd-Mon-yyyy (e.g., 15-Jul-2026)
 * - ISO 8601 (yyyy-mm-dd)
 * @param {string} dateStr
 * @returns {Date|null}
 */
export function parseDate(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return null;

  const trimmed = dateStr.trim();

  const ddmmyyyy = trimmed.match(/^(\d{1,2})[/.](\d{1,2})[/.](\d{4})$/);
  if (ddmmyyyy) {
    const [, d, m, y] = ddmmyyyy;
    const date = new Date(Number(y), Number(m) - 1, Number(d));
    if (isValidDate(date)) return date;
  }

  const months = {
    jan: 0,
    feb: 1,
    mar: 2,
    apr: 3,
    may: 4,
    jun: 5,
    jul: 6,
    aug: 7,
    sep: 8,
    oct: 9,
    nov: 10,
    dec: 11,
  };
  const ddMonyyyy = trimmed.match(/^(\d{1,2})-([A-Za-z]{3})-(\d{4})$/);
  if (ddMonyyyy) {
    const [, d, mon, y] = ddMonyyyy;
    const m = months[mon.toLowerCase()];
    if (m !== undefined) {
      const date = new Date(Number(y), m, Number(d));
      if (isValidDate(date)) return date;
    }
  }

  const iso = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) {
    const [, y, m, d] = iso;
    const date = new Date(Number(y), Number(m) - 1, Number(d));
    if (isValidDate(date)) return date;
  }

  return null;
}

/**
 * Check if a Date object is valid.
 * @param {Date} d
 * @returns {boolean}
 */
export function isValidDate(d) {
  return d instanceof Date && !isNaN(d.getTime());
}

/**
 * Calculate the number of days between two dates (absolute).
 * @param {Date} a
 * @param {Date} b
 * @returns {number}
 */
export function daysBetween(a, b) {
  const msPerDay = 86_400_000;
  return Math.abs(Math.floor((a.getTime() - b.getTime()) / msPerDay));
}

/**
 * Format a date as "15 Jul 2026".
 * @param {Date} date
 * @returns {string}
 */
export function formatDate(date) {
  if (!isValidDate(date)) return '';
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Check if a date is within the allowed range for address proof.
 * @param {Date} docDate - The date on the document
 * @param {Date} referenceDate - The KYC reference date
 * @param {number} maxDays - Maximum age in days (default 90)
 * @returns {{ valid: boolean, daysDiff: number }}
 */
export function isWithinAddressProofRange(docDate, referenceDate, maxDays = 90) {
  if (!isValidDate(docDate) || !isValidDate(referenceDate)) {
    return { valid: false, daysDiff: -1 };
  }

  if (docDate > referenceDate) {
    return { valid: false, daysDiff: -1 };
  }

  const diff = daysBetween(docDate, referenceDate);
  return { valid: diff <= maxDays, daysDiff: diff };
}
