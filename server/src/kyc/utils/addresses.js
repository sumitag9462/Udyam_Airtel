export const GST_STATE_MAP = Object.freeze({
  '01': 'Jammu & Kashmir',
  '02': 'Himachal Pradesh',
  '03': 'Punjab',
  '04': 'Chandigarh',
  '05': 'Uttarakhand',
  '06': 'Haryana',
  '07': 'Delhi',
  '08': 'Rajasthan',
  '09': 'Uttar Pradesh',
  '10': 'Bihar',
  '19': 'West Bengal',
  '23': 'Madhya Pradesh',
  '24': 'Gujarat',
  '27': 'Maharashtra',
  '29': 'Karnataka',
  '32': 'Kerala',
  '33': 'Tamil Nadu',
  '36': 'Telangana',
  '37': 'Andhra Pradesh',
});

/**
 * Extract 2-digit state code from GSTIN.
 * @param {string} gstin
 * @returns {string|null}
 */
export function getStateCodeFromGstin(gstin) {
  if (!gstin || typeof gstin !== 'string' || gstin.length < 2) return null;
  return gstin.slice(0, 2);
}

/**
 * Check if a state name matches a GSTIN state prefix.
 * @param {string} gstin
 * @param {string} stateName
 * @returns {boolean}
 */
export function verifyStateMatch(gstin, stateName) {
  const code = getStateCodeFromGstin(gstin);
  if (!code || !stateName) return false;

  const expectedState = GST_STATE_MAP[code];
  if (!expectedState) return false;

  const cleanExpected = expectedState.toLowerCase().replace(/[^a-z]/g, '');
  const cleanActual = String(stateName).toLowerCase().replace(/[^a-z]/g, '');

  return cleanExpected === cleanActual || cleanActual.includes(cleanExpected) || cleanExpected.includes(cleanActual);
}
