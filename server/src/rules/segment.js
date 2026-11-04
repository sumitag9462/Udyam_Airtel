/**
 * Business type to segment mapping derived deterministically from smb_leads.csv.
 * Exactly 35 business types mapped to 4 segments:
 * - 'prof': Professional offices
 * - 'micro': Micro retail & services
 * - 'multi': Small multi-site businesses
 * - 'mfg': Small manufacturers
 */

export const BUSINESS_TYPE_TO_SEGMENT = Object.freeze({
  // Professional offices
  'Dental clinic': 'prof',
  'Diagnostic lab': 'prof',
  'Physiotherapy clinic': 'prof',
  'Real estate agency': 'prof',
  'Law office': 'prof',
  'Coaching centre': 'prof',
  'CA firm': 'prof',
  'Architecture studio': 'prof',
  'Travel agency': 'prof',
  'Insurance agency': 'prof',

  // Micro retail & services
  Bakery: 'micro',
  'Stationery shop': 'micro',
  Optician: 'micro',
  'Kirana store': 'micro',
  Salon: 'micro',
  'Hardware store': 'micro',
  Boutique: 'micro',
  'Sweet shop': 'micro',
  Pharmacy: 'micro',
  'Mobile repair shop': 'micro',

  // Small multi-site businesses
  'Electronics retail chain': 'multi',
  'Apparel retail chain': 'multi',
  'Bakery chain': 'multi',
  'Restaurant chain': 'multi',
  'Pharmacy chain': 'multi',
  'Pre-school chain': 'multi',
  'Budget hotel group': 'multi',
  'Gym chain': 'multi',

  // Small manufacturers
  'Auto-parts unit': 'mfg',
  'Textile unit': 'mfg',
  'Plastic moulding unit': 'mfg',
  'Packaging unit': 'mfg',
  'Food processing unit': 'mfg',
  'Furniture workshop': 'mfg',
  'Printing press': 'mfg',
});

/**
 * Map business type to its segment code.
 * Falls back to 'micro' if unknown.
 * @param {string} businessType
 * @returns {'prof'|'micro'|'multi'|'mfg'}
 */
export function segmentOf(businessType) {
  if (!businessType || typeof businessType !== 'string') return 'micro';
  return BUSINESS_TYPE_TO_SEGMENT[businessType.trim()] || 'micro';
}
