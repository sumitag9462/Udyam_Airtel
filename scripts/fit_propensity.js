import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// CSV parser supporting quoted fields and CRLF line breaks
function parseCsv(content) {
  const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0);
  const header = parseCsvLine(lines[0]);
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const vals = parseCsvLine(lines[i]);
    if (vals.length === header.length) {
      const obj = {};
      for (let j = 0; j < header.length; j++) {
        obj[header[j]] = vals[j];
      }
      rows.push(obj);
    }
  }
  return rows;
}

function parseCsvLine(line) {
  const result = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      inQuotes = !inQuotes;
    } else if (c === ',' && !inQuotes) {
      result.push(cur.trim());
      cur = '';
    } else {
      cur += c;
    }
  }
  result.push(cur.trim());
  return result;
}

const csvPath = path.resolve(__dirname, '../../data/smb_leads.csv');
const data = parseCsv(fs.readFileSync(csvPath, 'utf8'));

console.log(`Loaded ${data.length} leads from smb_leads.csv`);

// Feature Engineering
// Continuous feature stats for standardization
const empVals = data.map((d) => Number(d.employee_count) || 1);
const sitesVals = data.map((d) => Number(d.num_sites) || 1);
const spendVals = data.map((d) => Number(d.monthly_telecom_spend_inr) || 1000);

function stats(arr) {
  const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
  const variance = arr.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / arr.length;
  const std = Math.sqrt(variance) || 1;
  return { mean, std };
}

const empStats = stats(empVals);
const sitesStats = stats(sitesVals);
const spendStats = stats(spendVals);

const featureNames = [
  'has_gstin',
  'has_udyam',
  'tier_1',
  'source_referral',
  'source_inbound_call',
  'source_channel_partner',
  'source_field_sales',
  'source_website_form',
  'segment_mfg',
  'segment_prof',
  'segment_multi',
  'norm_employee_count',
  'norm_num_sites',
  'norm_monthly_spend',
];

function extractFeatures(d) {
  return [
    d.has_gstin === 'Y' ? 1 : 0,
    d.has_udyam === 'Y' ? 1 : 0,
    Number(d.city_tier) === 1 ? 1 : 0,
    d.lead_source === 'Referral' ? 1 : 0,
    d.lead_source === 'Inbound call' ? 1 : 0,
    d.lead_source === 'Channel partner' ? 1 : 0,
    d.lead_source === 'Field sales' ? 1 : 0,
    d.lead_source === 'Website form' ? 1 : 0,
    d.segment === 'Small manufacturers' ? 1 : 0,
    d.segment === 'Professional offices' ? 1 : 0,
    d.segment === 'Small multi-site businesses' ? 1 : 0,
    ((Number(d.employee_count) || 1) - empStats.mean) / empStats.std,
    ((Number(d.num_sites) || 1) - sitesStats.mean) / sitesStats.std,
    ((Number(d.monthly_telecom_spend_inr) || 1000) - spendStats.mean) / spendStats.std,
  ];
}

const X = data.map((d) => extractFeatures(d));
const y = data.map((d) => (d.outcome === 'Activated' ? 1 : 0));

// Train Logistic Regression using Batch Gradient Descent with L2 regularisation
const numFeatures = featureNames.length;
let weights = new Array(numFeatures).fill(0);
let bias = -2.5; // logit(0.0736) ~ -2.53 baseline
const lr = 0.05;
const lambda = 0.001; // L2 penalty
const iterations = 500;

function sigmoid(z) {
  return 1 / (1 + Math.exp(-Math.max(-20, Math.min(20, z))));
}

for (let iter = 0; iter < iterations; iter++) {
  const dWeights = new Array(numFeatures).fill(0);
  let dBias = 0;

  for (let i = 0; i < X.length; i++) {
    let z = bias;
    for (let j = 0; j < numFeatures; j++) {
      z += weights[j] * X[i][j];
    }
    const p = sigmoid(z);
    const err = p - y[i];

    dBias += err;
    for (let j = 0; j < numFeatures; j++) {
      dWeights[j] += err * X[i][j];
    }
  }

  const m = X.length;
  bias -= (lr * dBias) / m;
  for (let j = 0; j < numFeatures; j++) {
    weights[j] -= lr * (dWeights[j] / m + lambda * weights[j]);
  }
}

// Evaluate ROC AUC
const predictions = X.map((xi, idx) => {
  let z = bias;
  for (let j = 0; j < numFeatures; j++) {
    z += weights[j] * xi[j];
  }
  return { prob: sigmoid(z), actual: y[idx] };
});

function calculateAuc(preds) {
  const sorted = [...preds].sort((a, b) => b.prob - a.prob);
  let positives = 0;
  let negatives = 0;
  for (const p of sorted) {
    if (p.actual === 1) positives++;
    else negatives++;
  }
  if (positives === 0 || negatives === 0) return 0.5;

  let rankSum = 0;
  const n = sorted.length;
  for (let i = 0; i < n; i++) {
    if (sorted[i].actual === 1) {
      rankSum += n - i;
    }
  }

  const u = rankSum - (positives * (positives + 1)) / 2;
  return u / (positives * negatives);
}

const auc = calculateAuc(predictions);
console.log(`Fitted Logistic Regression model on ${X.length} records. ROC AUC: ${auc.toFixed(4)}`);

const modelOutput = {
  algorithm: 'Logistic Regression (L2 Regularized)',
  referenceDataset: 'smb_leads.csv',
  totalObservations: X.length,
  totalActivations: y.filter((val) => val === 1).length,
  baselineActivationRate: (y.filter((val) => val === 1).length / X.length) * 100,
  rocAuc: Number(auc.toFixed(4)),
  bias: Number(bias.toFixed(5)),
  featureStats: {
    employeeCount: empStats,
    numSites: sitesStats,
    monthlySpend: spendStats,
  },
  weights: Object.fromEntries(
    featureNames.map((name, idx) => [name, Number(weights[idx].toFixed(5))])
  ),
  trainedAt: new Date().toISOString(),
};

const targetDir = path.resolve(__dirname, '../server/src/scoring');
fs.mkdirSync(targetDir, { recursive: true });
fs.writeFileSync(
  path.join(targetDir, 'propensity_model.json'),
  JSON.stringify(modelOutput, null, 2),
  'utf8'
);

console.log('Model exported to server/src/scoring/propensity_model.json');
