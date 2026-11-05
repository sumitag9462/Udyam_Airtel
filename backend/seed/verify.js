import mongoose from 'mongoose';
import { config } from '../src/config/env.js';
import logger from '../src/config/logger.js';
import { Product, CityTier, GstinRegistry, UdyamRegistry, Lead } from '../src/models/index.js';
import { validateGstin, validateUdyam } from '../src/utils/gstin.js';

/**
 * Expected drop reasons breakdown according to Section 3 of specification
 */
export const EXPECTED_DROP_REASONS = {
  Lead: {
    'Unreachable after 3 attempts': 805,
    'Not interested on first call': 470,
    'Wrong or invalid number': 319,
  },
  Contacted: {
    'Owner had no time for a visit': 531,
    'Locked in with current provider': 325,
    'Visit not scheduled by sales': 296,
    'Only wanted a mobile plan': 280,
  },
  'Needs assessed': {
    'Price too high': 414,
    'Competitor offered cheaper plan': 207,
    'Quote too complex to understand': 206,
    'Quote took too long to arrive': 179,
    'Decided to wait': 107,
  },
  'Quote accepted': {
    'Missing GST or Udyam document': 94,
    'Found paperwork too long': 79,
    'Authorised signatory not available': 53,
    'Document details did not match': 47,
  },
  'KYC complete': {
    'Installation delayed beyond 21 days': 98,
    'Customer cancelled before install': 53,
    'Site not feasible for fibre': 41,
    'First payment failed': 28,
  },
};

/**
 * Verify database assertions against Section 3 and Section 7 specifications.
 * Throws or returns { valid, failures }
 */
export async function verifySeed() {
  const isConnected = mongoose.connection.readyState === 1;
  if (!isConnected) {
    await mongoose.connect(config.MONGO_URI);
  }

  const failures = [];

  function assert(condition, message) {
    if (!condition) {
      failures.push(message);
      logger.error(`Assertion failed: ${message}`);
    } else {
      logger.debug(`Assertion passed: ${message}`);
    }
  }

  // 1. Products count
  const productCount = await Product.countDocuments();
  assert(productCount === 25, `Expected 25 products, got ${productCount}`);

  // 2. Leads count
  const leadCount = await Lead.countDocuments({ origin: 'seed' });
  assert(leadCount === 5000, `Expected 5,000 seed leads, got ${leadCount}`);

  // 3. GSTIN Registry count and statuses
  const gstinCount = await GstinRegistry.countDocuments();
  assert(gstinCount === 3534, `Expected 3,534 GSTINs, got ${gstinCount}`);

  const activeGstin = await GstinRegistry.countDocuments({ status: 'Active' });
  assert(activeGstin === 3266, `Expected 3,266 Active GSTINs, got ${activeGstin}`);

  const cancelledGstin = await GstinRegistry.countDocuments({ status: 'Cancelled' });
  assert(cancelledGstin === 167, `Expected 167 Cancelled GSTINs, got ${cancelledGstin}`);

  const suspendedGstin = await GstinRegistry.countDocuments({ status: 'Suspended' });
  assert(suspendedGstin === 101, `Expected 101 Suspended GSTINs, got ${suspendedGstin}`);

  // 4. Udyam Registry count
  const udyamCount = await UdyamRegistry.countDocuments();
  assert(udyamCount === 2723, `Expected 2,723 Udyam numbers, got ${udyamCount}`);

  // 5. CityTiers count
  const cityCount = await CityTier.countDocuments();
  assert(cityCount === 22, `Expected 22 unique city tiers, got ${cityCount}`);

  // 6. Cumulative funnel: 5,000 / 3,406 / 1,974 / 861 / 588 / 368
  const funnel0 = await Lead.countDocuments({ origin: 'seed', stageOrdinal: { $gte: 0 } });
  const funnel1 = await Lead.countDocuments({ origin: 'seed', stageOrdinal: { $gte: 1 } });
  const funnel2 = await Lead.countDocuments({ origin: 'seed', stageOrdinal: { $gte: 2 } });
  const funnel3 = await Lead.countDocuments({ origin: 'seed', stageOrdinal: { $gte: 3 } });
  const funnel4 = await Lead.countDocuments({ origin: 'seed', stageOrdinal: { $gte: 4 } });
  const funnel5 = await Lead.countDocuments({ origin: 'seed', stageOrdinal: { $gte: 5 } });

  assert(funnel0 === 5000, `Funnel Stage 0 (Lead): expected 5,000, got ${funnel0}`);
  assert(funnel1 === 3406, `Funnel Stage 1 (Contacted): expected 3,406, got ${funnel1}`);
  assert(funnel2 === 1974, `Funnel Stage 2 (Needs assessed): expected 1,974, got ${funnel2}`);
  assert(funnel3 === 861, `Funnel Stage 3 (Quote accepted): expected 861, got ${funnel3}`);
  assert(funnel4 === 588, `Funnel Stage 4 (KYC complete): expected 588, got ${funnel4}`);
  assert(funnel5 === 368, `Funnel Stage 5 (Activated): expected 368, got ${funnel5}`);

  // 7. Every registry GSTIN passes regex and checksum
  const allGstins = await GstinRegistry.find({}, { gstin: 1, _id: 0 }).lean();
  let invalidGstinCount = 0;
  for (const doc of allGstins) {
    if (!validateGstin(doc.gstin)) {
      invalidGstinCount++;
    }
  }
  assert(
    invalidGstinCount === 0,
    `All 3,534 GSTINs must pass regex & checksum; found ${invalidGstinCount} invalid`
  );

  // 8. Every registry Udyam passes regex
  const allUdyams = await UdyamRegistry.find({}, { udyamNumber: 1, _id: 0 }).lean();
  let invalidUdyamCount = 0;
  for (const doc of allUdyams) {
    if (!validateUdyam(doc.udyamNumber)) {
      invalidUdyamCount++;
    }
  }
  assert(
    invalidUdyamCount === 0,
    `All 2,723 Udyams must match regex; found ${invalidUdyamCount} invalid`
  );

  // 9. Every lead with hasGstin resolves in GstinRegistry
  const leadsWithGstin = await Lead.find(
    { origin: 'seed', hasGstin: true },
    { gstin: 1, _id: 0 }
  ).lean();
  assert(
    leadsWithGstin.length === 3534,
    `Expected 3,534 leads with hasGstin=true, got ${leadsWithGstin.length}`
  );

  const gstinSet = new Set(allGstins.map((g) => g.gstin));
  let unresolvableGstins = 0;
  for (const l of leadsWithGstin) {
    if (!gstinSet.has(l.gstin)) unresolvableGstins++;
  }
  assert(
    unresolvableGstins === 0,
    `Every lead GSTIN must resolve in registry; ${unresolvableGstins} failed`
  );

  // 10. Every lead with hasUdyam resolves in UdyamRegistry
  const leadsWithUdyam = await Lead.find(
    { origin: 'seed', hasUdyam: true },
    { udyamNumber: 1, _id: 0 }
  ).lean();
  assert(
    leadsWithUdyam.length === 2723,
    `Expected 2,723 leads with hasUdyam=true, got ${leadsWithUdyam.length}`
  );

  const udyamSet = new Set(allUdyams.map((u) => u.udyamNumber));
  let unresolvableUdyams = 0;
  for (const l of leadsWithUdyam) {
    if (!udyamSet.has(l.udyamNumber)) unresolvableUdyams++;
  }
  assert(
    unresolvableUdyams === 0,
    `Every lead Udyam must resolve in registry; ${unresolvableUdyams} failed`
  );

  // 11. Cancelled or suspended GSTIN leads: exactly 268
  const badStatusGstins = new Set(
    (
      await GstinRegistry.find(
        { status: { $in: ['Cancelled', 'Suspended'] } },
        { gstin: 1, _id: 0 }
      ).lean()
    ).map((g) => g.gstin)
  );
  let leadsWithCancelledOrSuspendedGstin = 0;
  for (const l of leadsWithGstin) {
    if (badStatusGstins.has(l.gstin)) leadsWithCancelledOrSuspendedGstin++;
  }
  assert(
    leadsWithCancelledOrSuspendedGstin === 268,
    `Expected 268 leads with Cancelled/Suspended GSTIN, got ${leadsWithCancelledOrSuspendedGstin}`
  );

  // 12. Drop reason counts match Section 3 exactly
  for (const [stage, expectedReasons] of Object.entries(EXPECTED_DROP_REASONS)) {
    for (const [reason, expectedCount] of Object.entries(expectedReasons)) {
      const count = await Lead.countDocuments({
        origin: 'seed',
        stageReached: stage,
        dropReason: reason,
      });
      assert(
        count === expectedCount,
        `Drop reason "${reason}" at stage "${stage}": expected ${expectedCount}, got ${count}`
      );
    }
  }

  return {
    valid: failures.length === 0,
    failures,
  };
}

// Standalone execution for npm run seed:verify
if (process.argv[1] && import.meta.url.endsWith(process.argv[1].split('/').pop())) {
  try {
    const { valid, failures } = await verifySeed();
    await mongoose.disconnect();
    if (!valid) {
      process.stderr.write(`\n❌ seed:verify failed with ${failures.length} errors:\n`);
      for (const f of failures) {
        process.stderr.write(`  - ${f}\n`);
      }
      process.exit(1);
    } else {
      process.stdout.write(
        `\n✅ seed:verify passed! All Section 3 and Section 7 assertions verified.\n`
      );
      process.exit(0);
    }
  } catch (err) {
    process.stderr.write(`\n❌ seed:verify error: ${err.message}\n`);
    process.exit(1);
  }
}
