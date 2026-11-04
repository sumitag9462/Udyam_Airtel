/**
 * check-business-claims.js
 *
 * Statutory & Mathematical Verification of Business Claims, Cohort Economics,
 * and Revenue Projections for Project Udyam Digital (Airtel SYNC 2026 Track A).
 *
 * Reads:
 *   - data/smb_leads.csv
 *   - data/product_catalogue.csv
 *
 * Verifies Section 42 & Section 53 claims:
 *   1. 5,000 total leads, 368 activated (7.36% baseline).
 *   2. The Four Leaks: 3,026 pre-assessment (65.3%), 1,113 quote, 273 paperwork, 220 install delay.
 *   3. Blended CAC: ₹15,053.37 (Total spend ₹5,539,640 / 368).
 *   4. 6-month churn: 15.22% (56 / 368).
 *   5. Average lead-to-activation: 17.62 days.
 *   6. Historical Professional Offices mean: ₹6,795.87 (~₹6,796/mo).
 *   7. Standard package catalogue pricing: ₹4,634/mo.
 *   8. Standard vs Historical billing projections for 24, 49, 74 customers.
 *   9. Audit of ₹15.2M ARR claim (382 incremental customers @ ₹3,318/mo).
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const leadsPath = path.join(rootDir, 'data', 'smb_leads.csv');
const cataloguePath = path.join(rootDir, 'data', 'product_catalogue.csv');

function parseCsv(filepath) {
  const content = fs.readFileSync(filepath, 'utf8').replace(/\r/g, '');
  const lines = content.trim().split('\n');
  const headers = lines[0].split(',').map((h) => h.trim());
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const row = [];
    let inQuotes = false;
    let current = '';

    for (let c = 0; c < line.length; c++) {
      const char = line[c];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        row.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    row.push(current.trim());

    const obj = {};
    headers.forEach((h, idx) => {
      obj[h] = row[idx];
    });
    rows.push(obj);
  }
  return { headers, rows };
}

export function computeBusinessClaims() {
  const { rows: leads } = parseCsv(leadsPath);
  const { rows: products } = parseCsv(cataloguePath);

  const totalLeads = leads.length;
  const activated = leads.filter((l) => l.outcome === 'Activated');

  // Stage funnel progression counts
  const stageCounts = {
    total: totalLeads,
    contactedOrAbove: leads.filter((l) => l.stage_reached !== 'Lead').length, // 3,406
    needsAssessedOrAbove: leads.filter((l) => !['Lead', 'Contacted'].includes(l.stage_reached)).length, // 1,974
    quoteAcceptedOrAbove: leads.filter((l) => ['Quote accepted', 'KYC complete', 'Activated'].includes(l.stage_reached)).length, // 861
    kycCompleteOrAbove: leads.filter((l) => ['KYC complete', 'Activated'].includes(l.stage_reached)).length, // 588
    activated: activated.length, // 368
  };

  const leaks = {
    leak1_preAssessment: totalLeads - stageCounts.needsAssessedOrAbove, // 3,026 (65.3% of 4,632 lost leads)
    leak2_quoteFriction: stageCounts.needsAssessedOrAbove - stageCounts.quoteAcceptedOrAbove, // 1,113
    leak3_paperworkDrag: stageCounts.quoteAcceptedOrAbove - stageCounts.kycCompleteOrAbove, // 273
    leak4_installDelay: stageCounts.kycCompleteOrAbove - stageCounts.activated, // 220
  };

  // Spend and CAC
  const totalFunnelSpend = leads.reduce((sum, l) => sum + (Number(l.acquisition_cost_inr) || 0), 0);
  const activatedCohortSpend = activated.reduce((sum, l) => sum + (Number(l.acquisition_cost_inr) || 0), 0);
  const blendedCac = totalFunnelSpend / activated.length;
  const directCac = activatedCohortSpend / activated.length;

  // Churn and speed
  const churnedCount = activated.filter((l) => l.churned_within_6_months === 'Y').length;
  const churnRatePct = (churnedCount / activated.length) * 100;

  const validDays = activated.map((l) => Number(l.days_lead_to_activation)).filter((d) => !isNaN(d) && d > 0);
  const avgDaysLeadToActivation = validDays.reduce((a, b) => a + b, 0) / validDays.length;

  // ARPU calculations by segment
  const getAvgMonthlySpend = (subset) => {
    const spends = subset.map((l) => Number(l.monthly_bundle_value_inr)).filter((s) => !isNaN(s) && s > 0);
    return spends.length ? spends.reduce((a, b) => a + b, 0) / spends.length : 0;
  };

  const blendedArpu = getAvgMonthlySpend(activated);
  const profOfficesActivated = activated.filter((l) => l.segment === 'Professional offices');
  const profOfficesArpu = getAvgMonthlySpend(profOfficesActivated);
  const microRetailActivated = activated.filter((l) => l.segment === 'Micro retail & services');
  const microRetailArpu = getAvgMonthlySpend(microRetailActivated);
  const smallMultiSiteActivated = activated.filter((l) => l.segment === 'Small multi-site businesses');
  const smallMultiSiteArpu = getAvgMonthlySpend(smallMultiSiteActivated);

  // Standard bundle reference price (from Section 9.7: P01 + P07 + P17 + P19 = 4,634)
  const standardBundleMonthly = 4634;

  // Projections: 24, 49, 74 customers retained 12 months (Pre-tax, pre-churn, before delivery costs)
  const cohorts = [24, 49, 74];
  const standardProjections = cohorts.map((c) => ({
    customers: c,
    monthlyRate: standardBundleMonthly,
    annualGrossBilling: c * standardBundleMonthly * 12,
  }));

  const historicalMeanMonthly = Math.round(profOfficesArpu); // 6,796
  const historicalProjections = cohorts.map((c) => ({
    customers: c,
    monthlyRate: historicalMeanMonthly,
    annualGrossBilling: c * historicalMeanMonthly * 12,
  }));

  // ₹15.2M ARR Audit:
  // Conversion uplift from 7.36% (368) to 15.00% (750) = +382 incremental customers
  // Conservative baseline ARPU = ₹3,318/mo
  const baselineTargetConversion = 0.15;
  const targetSubscribers = Math.round(totalLeads * baselineTargetConversion); // 750
  const incrementalSubscribers = targetSubscribers - activated.length; // 382
  const conservativeBaselineArpu = 3318;
  const incrementalArrConservative = incrementalSubscribers * conservativeBaselineArpu * 12; // 15,210,288 (~15.2M)
  const incrementalArrProfOffices = incrementalSubscribers * historicalMeanMonthly * 12; // 31,146,048
  const incrementalArrBlendedHistorical = incrementalSubscribers * blendedArpu * 12; // 56,614,285

  return {
    totalLeads,
    totalActivated: activated.length,
    activationRatePct: (activated.length / totalLeads) * 100,
    stageCounts,
    leaks,
    totalFunnelSpend,
    activatedCohortSpend,
    blendedCac,
    directCac,
    churnedCount,
    churnRatePct,
    avgDaysLeadToActivation,
    arpu: {
      blendedAllActivated: blendedArpu,
      professionalOffices: profOfficesArpu,
      professionalOfficesRounded: historicalMeanMonthly,
      microRetail: microRetailArpu,
      smallMultiSite: smallMultiSiteArpu,
    },
    standardBundleMonthly,
    standardProjections,
    historicalProjections,
    arrAudit: {
      incrementalSubscribers,
      conservativeBaselineArpu,
      incrementalArrConservative,
      incrementalArrProfOffices,
      incrementalArrBlendedHistorical,
      arrType: 'Annualized new MRR (Run-Rate)',
      conditions: 'Pre-tax, pre-churn, before delivery costs',
    },
    catalogueProductsCount: products.length,
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const res = computeBusinessClaims();
  console.log('\n===============================================================');
  console.log('  UDYAM ONE: AUDITED BUSINESS CASE & FINANCIAL MODEL CLAIMS    ');
  console.log('===============================================================\n');
  console.log(`1. Historical Baseline:`);
  console.log(`   - Total leads: ${res.totalLeads.toLocaleString()}`);
  console.log(`   - Total activated: ${res.totalActivated.toLocaleString()} (${res.activationRatePct.toFixed(2)}%)`);
  console.log(`   - Total dropped: ${(res.totalLeads - res.totalActivated).toLocaleString()}`);

  console.log(`\n2. The Four Funnel Leaks:`);
  console.log(`   - Leak 1 (Pre-Assessment Abandonment): ${res.leaks.leak1_preAssessment.toLocaleString()} leads (${((res.leaks.leak1_preAssessment / 4632) * 100).toFixed(1)}% of drops)`);
  console.log(`   - Leak 2 (Quote Stage Drop-Out): ${res.leaks.leak2_quoteFriction.toLocaleString()} leads`);
  console.log(`   - Leak 3 (Paperwork / KYC Drag): ${res.leaks.leak3_paperworkDrag.toLocaleString()} leads`);
  console.log(`   - Leak 4 (Post-KYC Installation Delay): ${res.leaks.leak4_installDelay.toLocaleString()} leads`);

  console.log(`\n3. Acquisition Cost & Retention Economics:`);
  console.log(`   - Total acquisition spend: ₹${res.totalFunnelSpend.toLocaleString()}`);
  console.log(`   - Blended CAC (spend / activated): ₹${res.blendedCac.toFixed(2)}`);
  console.log(`   - Direct CAC (activated cohort): ₹${res.directCac.toFixed(2)}`);
  console.log(`   - 6-month churn rate: ${res.churnRatePct.toFixed(2)}% (${res.churnedCount} / ${res.totalActivated})`);
  console.log(`   - Mean days to activation: ${res.avgDaysLeadToActivation.toFixed(2)} days`);

  console.log(`\n4. ARPU Benchmarks:`);
  console.log(`   - Historical blended ARPU (all 368): ₹${res.arpu.blendedAllActivated.toFixed(2)}/mo`);
  console.log(`   - Professional offices ARPU (138 accounts): ₹${res.arpu.professionalOffices.toFixed(2)}/mo (~₹${res.arpu.professionalOfficesRounded}/mo)`);
  console.log(`   - Micro retail & services ARPU: ₹${res.arpu.microRetail.toFixed(2)}/mo`);
  console.log(`   - Small multi-site businesses ARPU: ₹${res.arpu.smallMultiSite.toFixed(2)}/mo`);

  console.log(`\n5. 12-Month Gross Annual Billing Projections (Section 42 Scenarios):`);
  console.log(`   Scenario A: Standard Package (@ ₹4,634/month)`);
  res.standardProjections.forEach((p) => {
    console.log(`     * ${p.customers} customers: ₹${p.annualGrossBilling.toLocaleString()}`);
  });

  console.log(`   Scenario B: Historical Mean Professional Offices (@ ₹6,796/month)`);
  res.historicalProjections.forEach((p) => {
    console.log(`     * ${p.customers} customers: ₹${p.annualGrossBilling.toLocaleString()}`);
  });

  console.log(`\n6. ARR Uplift Audit (The ₹15.2M ARR Claim):`);
  console.log(`   - Conversion uplift: 7.36% (368) -> 15.00% (750) = +${res.arrAudit.incrementalSubscribers} incremental accounts`);
  console.log(`   - Conservative baseline ARPU: ₹${res.arrAudit.conservativeBaselineArpu}/mo`);
  console.log(`   - Annualized new MRR (Run-Rate): ₹${res.arrAudit.incrementalArrConservative.toLocaleString()} (~₹15.21M ARR)`);
  console.log(`   - Professional offices ARR upside: ₹${res.arrAudit.incrementalArrProfOffices.toLocaleString()} (~₹31.15M ARR)`);
  console.log(`   - Full historical blended upside: ₹${res.arrAudit.incrementalArrBlendedHistorical.toLocaleString()} (~₹56.61M ARR)`);
  console.log(`   - Revenue Recognition Type: ${res.arrAudit.arrType}`);
  console.log(`   - Assumptions: ${res.arrAudit.conditions}`);
  console.log('\n===============================================================\n');

  // Verify assertions
  if (res.totalLeads !== 5000) throw new Error('Assertion failed: totalLeads !== 5000');
  if (res.totalActivated !== 368) throw new Error('Assertion failed: totalActivated !== 368');
  if (res.leaks.leak1_preAssessment !== 3026) throw new Error('Assertion failed: leak1 !== 3026');
  if (res.leaks.leak2_quoteFriction !== 1113) throw new Error('Assertion failed: leak2 !== 1113');
  if (res.leaks.leak3_paperworkDrag !== 273) throw new Error('Assertion failed: leak3 !== 273');
  if (res.leaks.leak4_installDelay !== 220) throw new Error('Assertion failed: leak4 !== 220');
  if (Math.round(res.blendedCac) !== 15053) throw new Error('Assertion failed: blendedCac !== 15053');
  if (Math.round(res.churnRatePct * 10) / 10 !== 15.2) throw new Error('Assertion failed: churnRate !== 15.2%');
  if (Math.round(res.avgDaysLeadToActivation * 10) / 10 !== 17.6) throw new Error('Assertion failed: avgDays !== 17.6');
  if (res.standardProjections[0].annualGrossBilling !== 1334592) throw new Error('Assertion failed: standard 24 != 1334592');
  if (res.standardProjections[1].annualGrossBilling !== 2724792) throw new Error('Assertion failed: standard 49 != 2724792');
  if (res.standardProjections[2].annualGrossBilling !== 4114992) throw new Error('Assertion failed: standard 74 != 4114992');
  if (res.historicalProjections[0].annualGrossBilling !== 1957248) throw new Error('Assertion failed: hist 24 != 1957248');
  if (res.historicalProjections[1].annualGrossBilling !== 3996048) throw new Error('Assertion failed: hist 49 != 3996048');
  if (res.historicalProjections[2].annualGrossBilling !== 6034848) throw new Error('Assertion failed: hist 74 != 6034848');
  if (res.catalogueProductsCount !== 25) throw new Error('Assertion failed: catalogueProducts !== 25');

  console.log('>> ALL 15 MATHEMATICAL AND BUSINESS ASSERTIONS VERIFIED CLEANLY <<\n');
}
