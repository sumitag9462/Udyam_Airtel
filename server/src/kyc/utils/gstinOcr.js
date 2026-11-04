import { computeGstinChecksum, validateGstin } from '../../utils/gstin.js';

/**
 * Generate normalized candidate GSTIN strings from raw OCR text.
 * Accounts for common optical character recognition confusions:
 * - Digits misread as letters: 0 <-> O, 1 <-> I/L, 2 <-> Z, 5 <-> S, 8 <-> B
 * - Letters misread as digits: O <-> 0, I <-> 1, Z <-> 7/2, S <-> 5, B <-> 8
 * - Specific letter ambiguities: I <-> J
 * - Indian GSTIN structure: [0-9]{2} [A-Z]{5} [0-9]{4} [A-Z] [1-9A-Z] Z [0-9A-Z]
 */
export function generateGstinCandidates(rawStr) {
  if (!rawStr || typeof rawStr !== 'string') return [];
  const cleaned = rawStr.toUpperCase().replace(/[^0-9A-Z]/g, '');
  if (cleaned.length !== 15) return [];

  const candidates = new Set([cleaned]);

  const toDigit = { O: '0', I: '1', L: '1', Z: '2', S: '5', B: '8' };
  const toLetter = { '0': 'O', '1': 'I', '2': 'Z', '5': 'S', '8': 'B' };

  // Base normalization following GSTIN structure
  const base = cleaned.split('');

  // Index 0-1: State digits
  for (let i = 0; i <= 1; i++) {
    if (toDigit[base[i]]) base[i] = toDigit[base[i]];
  }

  // Index 2-6: PAN entity letters
  for (let i = 2; i <= 6; i++) {
    if (toLetter[base[i]]) base[i] = toLetter[base[i]];
  }

  // Index 7-10: PAN sequential digits
  for (let i = 7; i <= 10; i++) {
    if (toDigit[base[i]]) base[i] = toDigit[base[i]];
  }

  // Index 11: PAN check letter
  if (toLetter[base[11]]) base[11] = toLetter[base[11]];

  // Index 13: Standard 'Z'
  if (base[13] === '7' || base[13] === '2') base[13] = 'Z';

  // Candidate with calculated checksum
  const p14 = base.slice(0, 14).join('');
  const checkChar = computeGstinChecksum(p14);
  if (checkChar) {
    candidates.add(p14 + checkChar);
  }
  candidates.add(base.join(''));

  // Common OCR permutations:
  // 1. Index 4: I <-> J
  if (base[4] === 'I' || base[4] === 'J') {
    const perm = [...base];
    perm[4] = perm[4] === 'I' ? 'J' : 'I';
    const permP14 = perm.slice(0, 14).join('');
    const c = computeGstinChecksum(permP14);
    if (c) candidates.add(permP14 + c);
  }

  // 2. Index 7: 8 <-> 5
  if (base[7] === '8' || base[7] === '5') {
    const perm = [...base];
    perm[7] = perm[7] === '8' ? '5' : '8';
    const permP14 = perm.slice(0, 14).join('');
    const c = computeGstinChecksum(permP14);
    if (c) candidates.add(permP14 + c);
  }

  // 3. Index 13: Ensure 'Z'
  if (base[13] !== 'Z') {
    const perm = [...base];
    perm[13] = 'Z';
    const permP14 = perm.slice(0, 14).join('');
    const c = computeGstinChecksum(permP14);
    if (c) candidates.add(permP14 + c);
  }

  return Array.from(candidates);
}

/**
 * Return the first valid GSTIN candidate that passes the MOD-36 checksum.
 */
export function getBestGstinCandidate(rawStr) {
  const candidates = generateGstinCandidates(rawStr);
  for (const c of candidates) {
    if (validateGstin(c)) {
      return c;
    }
  }
  return candidates[0] || null;
}
