/**
 * GSTIN and Udyam validators.
 * Alphabet: 0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ
 * Checksum: For i in 0..13: v = index(char) * (i even ? 1 : 2); add floor(v/36) + v % 36 to sum.
 * Check character = alphabet[(36 - sum % 36) % 36].
 */

export const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
export const UDYAM_REGEX = /^UDYAM-[A-Z]{2}-00-[0-9]{7}$/;

const GSTIN_ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const GSTIN_CHAR_MAP = new Map(GSTIN_ALPHABET.split('').map((char, index) => [char, index]));

/**
 * Compute the expected checksum character for a 14-character GSTIN prefix.
 * @param {string} gstin14
 * @returns {string}
 */
export function computeGstinChecksum(gstin14) {
  if (!gstin14 || gstin14.length < 14) return '';

  let sum = 0;
  for (let i = 0; i < 14; i++) {
    const char = gstin14[i].toUpperCase();
    const val = GSTIN_CHAR_MAP.get(char);
    if (val === undefined) return '';

    const factor = i % 2 === 0 ? 1 : 2;
    const v = val * factor;
    sum += Math.floor(v / 36) + (v % 36);
  }

  const checkIndex = (36 - (sum % 36)) % 36;
  return GSTIN_ALPHABET[checkIndex];
}

/**
 * Validate a 15-character GSTIN format and checksum.
 * @param {string} gstin
 * @returns {boolean}
 */
export function validateGstin(gstin) {
  if (!gstin || typeof gstin !== 'string') return false;
  const upper = gstin.trim().toUpperCase();
  if (!GSTIN_REGEX.test(upper)) return false;

  const prefix = upper.slice(0, 14);
  const expectedCheckChar = computeGstinChecksum(prefix);
  return upper[14] === expectedCheckChar;
}

export const validateGstinChecksum = validateGstin;

/**
 * Extract 2-digit state code from GSTIN.
 * @param {string} gstin
 * @returns {string}
 */
export function getGstinStateCode(gstin) {
  if (!gstin || typeof gstin !== 'string') return '';
  return gstin.trim().slice(0, 2);
}

/**
 * Validate Udyam registration number format.
 * @param {string} udyam
 * @returns {boolean}
 */
export function validateUdyam(udyam) {
  if (!udyam || typeof udyam !== 'string') return false;
  return UDYAM_REGEX.test(udyam.trim().toUpperCase());
}
