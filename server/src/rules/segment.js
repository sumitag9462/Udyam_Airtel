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
  'CA / Law office': 'prof',
  'Law Firm & Associates': 'prof',
  'CA firm': 'prof',
  'Architecture studio': 'prof',
  'Travel agency': 'prof',
  'Insurance agency': 'prof',
  'IT / Software services': 'prof',
  'Wellness clinic': 'prof',
  'Logistics office': 'prof',
  'Coaching institute': 'prof',
  'Coaching centre': 'prof',

  // Micro retail & services
  Bakery: 'micro',
  'Stationery shop': 'micro',
  Optician: 'micro',
  'Kirana store': 'micro',
  'Kirana / Grocery': 'micro',
  'Retail store': 'micro',
  'General SMB': 'micro',
  Salon: 'micro',
  'Hardware store': 'micro',
  Boutique: 'micro',
  'Clothing boutique': 'micro',
  'Sweet shop': 'micro',
  Pharmacy: 'micro',
  'Pharmacy retailer': 'micro',
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
  'Clinic / Pathology lab': 'multi',

  // Small manufacturers
  'Auto-parts unit': 'mfg',
  'Auto parts / Component mfg': 'mfg',
  'Diamond polishing unit': 'mfg',
  'Engineering works': 'mfg',
  'Garment exporter': 'mfg',
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
  const trimmed = businessType.trim();
  if (BUSINESS_TYPE_TO_SEGMENT[trimmed]) return BUSINESS_TYPE_TO_SEGMENT[trimmed];
  const lower = trimmed.toLowerCase();
  for (const [key, seg] of Object.entries(BUSINESS_TYPE_TO_SEGMENT)) {
    if (key.toLowerCase() === lower) return seg;
  }
  if (lower.includes('law') || lower.includes('ca') || lower.includes('clinic') || lower.includes('consult')) return 'prof';
  if (lower.includes('chain') || lower.includes('multi')) return 'multi';
  if (lower.includes('mfg') || lower.includes('unit') || lower.includes('factory')) return 'mfg';
  return 'micro';
}
