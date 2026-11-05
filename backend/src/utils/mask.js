/**
 * PII masking utilities.
 * No raw PII in logs, analytics, errors or admin lists.
 */

/**
 * Mask a GSTIN, showing only the last 4 characters.
 * @param {string|null|undefined} gstin
 * @returns {string}
 */
export function maskGstin(gstin) {
  if (!gstin) return '';
  if (gstin.length <= 4) return gstin;
  return '*'.repeat(gstin.length - 4) + gstin.slice(-4);
}

/**
 * Mask a Udyam number, showing only the last 4 characters.
 * @param {string|null|undefined} udyam
 * @returns {string}
 */
export function maskUdyam(udyam) {
  if (!udyam) return '';
  if (udyam.length <= 4) return udyam;
  return '*'.repeat(udyam.length - 4) + udyam.slice(-4);
}

/**
 * Mask a phone number, showing only the last 4 digits.
 * @param {string|null|undefined} phone
 * @returns {string}
 */
export function maskPhone(phone) {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.length <= 4) return digits;
  return '*'.repeat(digits.length - 4) + digits.slice(-4);
}

/**
 * Mask an ID number (Aadhaar, PAN, etc.), showing only the last 4 characters.
 * @param {string|null|undefined} id
 * @returns {string}
 */
export function maskIdNumber(id) {
  if (!id) return '';
  if (id.length <= 4) return id;
  return '*'.repeat(id.length - 4) + id.slice(-4);
}

/**
 * Extract the last 4 digits from a phone number.
 * @param {string|null|undefined} phone
 * @returns {string}
 */
export function phoneLast4(phone) {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  return digits.slice(-4);
}

/**
 * Mask an email address (show first 2 chars + domain).
 * @param {string|null|undefined} email
 * @returns {string}
 */
export function maskEmail(email) {
  if (!email) return '';
  const [local, domain] = email.split('@');
  if (!domain) return '***';
  const visibleLocal = local.slice(0, 2);
  return `${visibleLocal}***@${domain}`;
}
