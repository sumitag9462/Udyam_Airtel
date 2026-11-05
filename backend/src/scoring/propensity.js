import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let modelData = null;

function loadModel() {
  if (!modelData) {
    const modelPath = path.resolve(__dirname, 'propensity_model.json');
    if (fs.existsSync(modelPath)) {
      modelData = JSON.parse(fs.readFileSync(modelPath, 'utf8'));
    } else {
      modelData = {
        bias: -2.66,
        weights: {},
        rocAuc: 0.6879,
        featureStats: {
          employeeCount: { mean: 20.46, std: 31.28 },
          numSites: { mean: 2.04, std: 2.58 },
          monthlySpend: { mean: 3317.93, std: 4270.78 },
        },
      };
    }
  }
  return modelData;
}

function sigmoid(z) {
  return 1 / (1 + Math.exp(-Math.max(-20, Math.min(20, z))));
}

/**
 * Score a lead using the fitted logistic regression propensity model.
 * Provides transparent explanations with top positive and negative driver factors.
 * @param {object} lead
 * @returns {{ score: number, percentage: number, drivers: Array<object>, rocAuc: number }}
 */
export function calculatePropensityScore(lead) {
  const model = loadModel();
  const w = model.weights;
  const stats = model.featureStats;

  const contributions = [];

  // Binary / categorical contributions
  const hasGstin = lead.hasGstin === true || lead.has_gstin === 'Y';
  if (hasGstin && w.has_gstin) {
    contributions.push({ name: 'Active GSTIN Registered', impact: w.has_gstin, positive: true });
  }

  const hasUdyam = lead.hasUdyam === true || lead.has_udyam === 'Y';
  if (hasUdyam && w.has_udyam) {
    contributions.push({ name: 'Udyam MSME Registered', impact: w.has_udyam, positive: true });
  }

  const tier = Number(lead.cityTier || lead.city_tier) || 2;
  if (tier === 1 && w.tier_1) {
    contributions.push({ name: 'Tier 1 Metro Location', impact: w.tier_1, positive: true });
  }

  const src = lead.leadSource || lead.lead_source;
  if (src === 'Referral' && w.source_referral) {
    contributions.push({ name: 'Referral Channel Lead (+14.8% baseline)', impact: w.source_referral, positive: true });
  } else if (src === 'Inbound call' && w.source_inbound_call) {
    contributions.push({ name: 'High-Intent Inbound Call', impact: w.source_inbound_call, positive: true });
  } else if (src === 'Website form' && w.source_website_form) {
    contributions.push({ name: 'Cold Web Form Source', impact: w.source_website_form, positive: false });
  } else if (src === 'Field sales' && w.source_field_sales) {
    contributions.push({ name: 'Field Sales Channel', impact: w.source_field_sales, positive: false });
  }

  const seg = lead.segment;
  if ((seg === 'prof' || seg === 'Professional offices') && w.segment_prof) {
    contributions.push({ name: 'Professional Office Segment (11.1% conversion)', impact: w.segment_prof, positive: true });
  } else if ((seg === 'mfg' || seg === 'Small manufacturers') && w.segment_mfg) {
    contributions.push({ name: 'Small Manufacturer Segment (12.8% conversion)', impact: w.segment_mfg, positive: true });
  }

  // Continuous contributions
  const emp = Number(lead.employeeCount || lead.employee_count) || 1;
  const normEmp = (emp - stats.employeeCount.mean) / stats.employeeCount.std;
  const empImpact = normEmp * (w.norm_employee_count || 0.095);
  if (Math.abs(empImpact) > 0.02) {
    contributions.push({
      name: `${emp} Employees Scale`,
      impact: empImpact,
      positive: empImpact > 0,
    });
  }

  const spend = Number(lead.monthlyTelecomSpend || lead.monthly_telecom_spend_inr) || 1000;
  const normSpend = (spend - stats.monthlySpend.mean) / stats.monthlySpend.std;
  const spendImpact = normSpend * (w.norm_monthly_spend || 0.15);
  if (Math.abs(spendImpact) > 0.02) {
    contributions.push({
      name: `Monthly Spend ₹${spend.toLocaleString('en-IN')}`,
      impact: spendImpact,
      positive: spendImpact > 0,
    });
  }

  // Compute logit z
  let z = model.bias;
  for (const c of contributions) {
    z += c.impact;
  }

  const score = sigmoid(z);
  const percentage = Number((score * 100).toFixed(1));

  // Sort drivers by absolute magnitude
  const drivers = contributions
    .sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact))
    .slice(0, 4);

  return {
    score: Number(score.toFixed(4)),
    percentage,
    drivers,
    rocAuc: model.rocAuc,
  };
}

export function getPropensityModelMetadata() {
  return loadModel();
}
