import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { parse } from 'csv-parse/sync';

/**
 * Stage mapping to ordinal
 */
export const STAGE_MAP = {
  Lead: 0,
  Contacted: 1,
  'Needs assessed': 2,
  'Quote accepted': 3,
  'KYC complete': 4,
  Activated: 5,
};

/**
 * Segment full name to code mapping
 */
export const SEGMENT_MAP = {
  'Professional offices': 'prof',
  'Micro retail & services': 'micro',
  'Small multi-site businesses': 'multi',
  'Small manufacturers': 'mfg',
};

/**
 * Parse a boolean from 'Y'/'N' or true/false
 */
export function parseBool(val) {
  if (val === 'Y' || val === 'true' || val === true) return true;
  if (val === 'N' || val === 'false' || val === false) return false;
  return Boolean(val);
}

/**
 * Parse an optional trimmed string or null if empty
 */
export function parseString(val) {
  if (val === null || val === undefined) return null;
  const trimmed = String(val).trim();
  return trimmed === '' ? null : trimmed;
}

/**
 * Parse an optional date or null if blank
 */
export function parseOptionalDate(val) {
  const str = parseString(val);
  if (!str) return null;
  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Parse a semicolon-separated list into an array of trimmed strings
 */
export function parseSemicolonList(val) {
  const str = parseString(val);
  if (!str) return [];
  return str
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Parse city tiers e.g. "1;2" or "1" into array of numbers [1, 2]
 */
export function parseCityTiers(val) {
  const items = parseSemicolonList(val);
  return items.map((i) => Number(i)).filter((n) => !isNaN(n));
}

/**
 * Parse dependencies e.g. "P01|P02|P03" into array of strings
 */
export function parseRequiresOneOf(val) {
  const str = parseString(val);
  if (!str) return [];
  return str
    .split('|')
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Parse bundle products e.g. "P01x1;P07x2" or "P02x1;P09x1;P10x1;P23x2" into [{productId, qty}]
 */
export function parseBundleProducts(val) {
  const items = parseSemicolonList(val);
  return items
    .map((item) => {
      const match = item.match(/^([A-Za-z0-9]+)x(\d+)$/);
      if (match) {
        return {
          productId: match[1],
          qty: Number(match[2]),
        };
      }
      return null;
    })
    .filter(Boolean);
}

/**
 * Parse CSV file with BOM, CRLF, and quote tolerance
 */
export function readCsv(filePath) {
  const absolutePath = path.resolve(filePath);
  const content = fs.readFileSync(absolutePath, 'utf8');
  return parse(content, {
    columns: true,
    bom: true,
    relax_quotes: true,
    skip_empty_lines: true,
    trim: true,
  });
}

/**
 * Compute sha256 checksum of catalogue
 */
export function computeCatalogueRulesVersion(filePath) {
  const content = fs.readFileSync(path.resolve(filePath), 'utf8');
  return crypto.createHash('sha256').update(content).digest('hex').slice(0, 16);
}

/**
 * Parse product catalogue
 */
export function parseProductCatalogue(filePath) {
  const rows = readCsv(filePath);
  const rulesVersion = computeCatalogueRulesVersion(filePath);

  return rows.map((r) => ({
    productId: parseString(r.product_id),
    category: parseString(r.category),
    productName: parseString(r.product_name),
    description: parseString(r.description),
    unit: parseString(r.unit),
    priceMinInrPerMonth: Number(r.price_min_inr_per_month),
    priceMaxInrPerMonth: Number(r.price_max_inr_per_month),
    oneTimeSetupInr: Number(r.one_time_setup_inr),
    minContractMonths: Number(r.min_contract_months),
    availableCityTiers: parseCityTiers(r.available_city_tiers),
    minEmployees: Number(r.min_employees),
    minSites: Number(r.min_sites),
    requiresGstin: parseBool(r.requires_gstin),
    requiresOneOf: parseRequiresOneOf(r.requires_one_of),
    typicalInstallDays: Number(r.typical_install_days),
    targetSegments: parseSemicolonList(r.target_segments),
    rulesVersion,
    isActive: true,
  }));
}

/**
 * Parse GSTIN registry
 */
export function parseGstinRegistry(filePath) {
  const rows = readCsv(filePath);
  return rows.map((r) => ({
    gstin: parseString(r.gstin),
    legalName: parseString(r.legal_name),
    tradeName: parseString(r.trade_name) || parseString(r.legal_name),
    constitution: parseString(r.constitution),
    principalPlaceOfBusiness: parseString(r.principal_place_of_business),
    state: parseString(r.state),
    registrationDate: parseOptionalDate(r.registration_date),
    status: parseString(r.status),
  }));
}

/**
 * Parse Udyam registry
 */
export function parseUdyamRegistry(filePath) {
  const rows = readCsv(filePath);
  return rows.map((r) => ({
    udyamNumber: parseString(r.udyam_number),
    enterpriseName: parseString(r.enterprise_name),
    enterpriseType: parseString(r.enterprise_type),
    majorActivity: parseString(r.major_activity),
    nicDescription: parseString(r.nic_description),
    state: parseString(r.state),
    city: parseString(r.city),
    dateOfRegistration: parseOptionalDate(r.date_of_registration),
  }));
}

/**
 * Parse SMB leads and derive city tiers
 */
export function parseSmbLeads(filePath) {
  const rows = readCsv(filePath);
  const cityTiersMap = new Map();

  const leads = rows.map((r) => {
    const city = parseString(r.city);
    const state = parseString(r.state);
    const tier = Number(r.city_tier);

    if (city && !cityTiersMap.has(city)) {
      cityTiersMap.set(city, { city, state, tier });
    }

    const stageReached = parseString(r.stage_reached);
    const stageOrdinal = STAGE_MAP[stageReached] ?? 0;
    const rawSegment = parseString(r.segment);
    const segmentCode = SEGMENT_MAP[rawSegment] || rawSegment;

    return {
      leadId: parseString(r.lead_id),
      origin: 'seed',
      createdDate: parseOptionalDate(r.created_date) || new Date(),
      businessName: parseString(r.business_name),
      businessType: parseString(r.business_type),
      segment: segmentCode,
      city,
      cityTier: tier,
      state,
      preferredLanguage: parseString(r.preferred_language),
      employeeCount: Number(r.employee_count),
      numSites: Number(r.num_sites),
      turnoverBand: parseString(r.annual_turnover_band),
      hasGstin: parseBool(r.has_gstin),
      gstin: parseString(r.gstin),
      hasUdyam: parseBool(r.has_udyam),
      udyamNumber: parseString(r.udyam_number),
      currentInternet: parseString(r.current_internet),
      currentProvider: parseString(r.current_provider),
      monthlyTelecomSpend: r.monthly_telecom_spend_inr ? Number(r.monthly_telecom_spend_inr) : null,
      productsOfInterest: parseSemicolonList(r.products_of_interest),
      contactName: parseString(r.contact_name),
      contactRole: parseString(r.contact_role),
      leadSource: parseString(r.lead_source),
      stageReached,
      stageOrdinal,
      stageDates: {
        contacted: parseOptionalDate(r.contacted_date),
        needsAssessed: parseOptionalDate(r.needs_assessed_date),
        quoteAccepted: parseOptionalDate(r.quote_accepted_date),
        kycComplete: parseOptionalDate(r.kyc_complete_date),
        activated: parseOptionalDate(r.activated_date),
      },
      outcome: parseString(r.outcome),
      dropReason: parseString(r.drop_reason),
      daysLeadToActivation: r.days_lead_to_activation ? Number(r.days_lead_to_activation) : null,
      followUpCalls: r.customer_follow_up_calls ? Number(r.customer_follow_up_calls) : 0,
      bundle: parseBundleProducts(r.bundle_products),
      monthlyBundleValue: r.monthly_bundle_value_inr ? Number(r.monthly_bundle_value_inr) : null,
      oneTimeSetup: r.one_time_setup_inr ? Number(r.one_time_setup_inr) : null,
      contractMonths: r.contract_months ? Number(r.contract_months) : null,
      churned6m: r.churned_within_6_months !== '' ? parseBool(r.churned_within_6_months) : null,
      nps: r.nps_score ? Number(r.nps_score) : null,
      acquisitionCost: r.acquisition_cost_inr ? Number(r.acquisition_cost_inr) : null,
      advisorStatus: stageReached === 'Activated' ? 'ordered' : 'open',
    };
  });

  const cityTiers = Array.from(cityTiersMap.values());
  return { leads, cityTiers };
}
