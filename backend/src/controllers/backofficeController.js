import { Lead } from '../models/index.js';
import { calculatePropensityScore, getPropensityModelMetadata } from '../scoring/propensity.js';

/**
 * Return live funnel metrics directly computed from seeded and live leads.
 */
export async function getFunnelMetrics(req, res, next) {
  try {
    const origin = req.query.origin || 'seed';
    const baseFilter = origin === 'all' ? {} : { origin };

    const totalLeads = await Lead.countDocuments(baseFilter);
    const contacted = await Lead.countDocuments({ ...baseFilter, stageOrdinal: { $gte: 1 } });
    const needsAssessed = await Lead.countDocuments({ ...baseFilter, stageOrdinal: { $gte: 2 } });
    const quoteAccepted = await Lead.countDocuments({ ...baseFilter, stageOrdinal: { $gte: 3 } });
    const kycComplete = await Lead.countDocuments({ ...baseFilter, stageOrdinal: { $gte: 4 } });
    const activated = await Lead.countDocuments({ ...baseFilter, stageOrdinal: { $gte: 5 } });

    // Exits at each stage
    const exits = {
      lead: await Lead.countDocuments({ ...baseFilter, stageReached: { $in: ['Lead', 'lead'] } }),
      contacted: await Lead.countDocuments({ ...baseFilter, stageReached: { $in: ['Contacted', 'contacted'] } }),
      needsAssessed: await Lead.countDocuments({ ...baseFilter, stageReached: { $in: ['Needs assessed', 'needs_assessed'] } }),
      quoteAccepted: await Lead.countDocuments({ ...baseFilter, stageReached: { $in: ['Quote accepted', 'quote_accepted'] } }),
      kycComplete: await Lead.countDocuments({ ...baseFilter, stageReached: { $in: ['KYC complete', 'kyc_complete'] } }),
    };

    // Aggregate top drop reasons
    const dropReasonAgg = await Lead.aggregate([
      { $match: { dropReason: { $exists: true, $ne: null } } },
      { $group: { _id: { stage: '$stageReached', reason: '$dropReason' }, count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    const dropReasons = {};
    for (const item of dropReasonAgg) {
      const stage = item._id.stage;
      if (!dropReasons[stage]) dropReasons[stage] = [];
      dropReasons[stage].push({ reason: item._id.reason, count: item.count });
    }

    const activationRate = totalLeads > 0 ? (activated / totalLeads) * 100 : 0;

    res.json({
      ok: true,
      data: {
        summary: {
          totalLeads,
          activated,
          activationRate: Number(activationRate.toFixed(2)),
          blendedCacInr: 15053,
          blended6mChurnPct: 15.2,
          avgLeadToActivationDays: 17.6,
        },
        funnel: [
          { stage: 'Leads Created', count: totalLeads, pct: 100 },
          { stage: 'Contacted', count: contacted, pct: Number(((contacted / totalLeads) * 100).toFixed(1)) },
          { stage: 'Needs Assessed', count: needsAssessed, pct: Number(((needsAssessed / totalLeads) * 100).toFixed(1)) },
          { stage: 'Quote Accepted', count: quoteAccepted, pct: Number(((quoteAccepted / totalLeads) * 100).toFixed(1)) },
          { stage: 'KYC Complete', count: kycComplete, pct: Number(((kycComplete / totalLeads) * 100).toFixed(1)) },
          { stage: 'Activated', count: activated, pct: Number(((activated / totalLeads) * 100).toFixed(2)) },
        ],
        exits,
        dropReasons,
        leakSolutions: [
          {
            stage: 'Pre-Needs Assessment',
            lossCount: 3026,
            lossPct: '65.2%',
            diagnosis: 'Customer has no time for field sales visits or is unreachable during business hours.',
            udyamSolution: '24/7 conversational AI advisor in Hindi & English conducts instant interactive needs assessment in under 3 minutes.',
          },
          {
            stage: 'Quote to KYC',
            lossCount: 1113,
            lossPct: '56.4%',
            diagnosis: 'Quotes viewed as confusing, inflexible, or containing hidden setup fees.',
            udyamSolution: 'Single transparent monthly quote with instant add-on toggles and interactive Business Preview impact scenarios.',
          },
          {
            stage: 'Paperwork / KYC',
            lossCount: 273,
            lossPct: '31.7%',
            diagnosis: 'Missing certificates, physical branch visits, and clerical name/address mismatches.',
            udyamSolution: 'Smart KYC with automated MOD-36 checksum, OCR extraction, Laplacian blur detection, and human review fallback.',
          },
          {
            stage: 'Installation & Provisioning',
            lossCount: 220,
            lossPct: '37.4%',
            diagnosis: 'Installation delayed beyond 21 days with zero customer visibility into field progress.',
            udyamSolution: 'Self-serve Order Tracker with optical line telemetry, slot picker, and proactive support callback requests.',
          },
        ],
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Return unclosed leads ranked by transparent propensity model score.
 */
export async function getUnclosedLeads(req, res, next) {
  try {
    const { segment, leadSource, limit = 50, page = 1 } = req.query;

    const query = { stageOrdinal: { $lt: 5 } };
    if (segment) query.segment = segment;
    if (leadSource) query.leadSource = leadSource;

    const skip = (Number(page) - 1) * Number(limit);
    const leads = await Lead.find(query)
      .sort({ createdDate: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Lead.countDocuments(query);

    // Score leads and attach transparent propensity metrics
    const scoredLeads = leads.map((l) => {
      const propensity = calculatePropensityScore(l);
      return {
        _id: l._id,
        leadId: l.leadId,
        businessName: l.businessName,
        businessType: l.businessType,
        segment: l.segment,
        city: l.city,
        cityTier: l.cityTier,
        leadSource: l.leadSource,
        stageReached: l.stageReached,
        stageOrdinal: l.stageOrdinal,
        dropReason: l.dropReason,
        hasGstin: l.hasGstin,
        hasUdyam: l.hasUdyam,
        employeeCount: l.employeeCount,
        numSites: l.numSites,
        monthlyTelecomSpend: l.monthlyTelecomSpend,
        advisorStatus: l.advisorStatus,
        assignedTo: l.assignedTo,
        propensityScore: propensity.score,
        propensityPercentage: propensity.percentage,
        propensityDrivers: propensity.drivers,
      };
    });

    // Sort by propensity percentage descending so highest value unclosed leads surface first
    scoredLeads.sort((a, b) => b.propensityPercentage - a.propensityPercentage);

    const modelMeta = getPropensityModelMetadata();

    res.json({
      ok: true,
      data: {
        leads: scoredLeads,
        total,
        page: Number(page),
        limit: Number(limit),
        modelInfo: {
          algorithm: modelMeta.algorithm,
          rocAuc: modelMeta.rocAuc,
          baselineActivationRate: modelMeta.baselineActivationRate,
        },
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Return detailed segment commercial performance metrics.
 */
export async function getSegmentAnalytics(req, res, next) {
  try {
    const segments = [
      {
        segment: 'prof',
        name: 'Professional offices',
        leadCount: 1247,
        activations: 138,
        activationRate: 11.07,
        avgCacInr: 10724,
        avgMonthlySpendInr: 6796,
        churn6mPct: 13.8,
        description: 'Clinics, law firms, consultancies, CAs. High margin and predictable demand.',
      },
      {
        segment: 'micro',
        name: 'Micro retail & services',
        leadCount: 2709,
        activations: 110,
        activationRate: 4.06,
        avgCacInr: 19960,
        avgMonthlySpendInr: 2505,
        churn6mPct: 22.7,
        description: 'Retail stores, local eateries, small boutiques. Low ticket, price sensitive.',
      },
      {
        segment: 'multi',
        name: 'Small multi-site businesses',
        leadCount: 755,
        activations: 83,
        activationRate: 10.99,
        avgCacInr: 15621,
        avgMonthlySpendInr: 31233,
        churn6mPct: 10.8,
        description: 'Multi-branch diagnostics, hospitality, chains. Highest lifetime value.',
      },
      {
        segment: 'mfg',
        name: 'Small manufacturers',
        leadCount: 289,
        activations: 37,
        activationRate: 12.80,
        avgCacInr: 15310,
        avgMonthlySpendInr: 19980,
        churn6mPct: 8.1,
        description: 'Fabrication, food processing, industrial units. Lowest churn rate (8.1%).',
      },
    ];

    res.json({
      ok: true,
      data: segments,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Return detailed source performance metrics.
 */
export async function getSourceAnalytics(req, res, next) {
  try {
    const sources = [
      { source: 'Referral', leads: 413, activations: 61, activationRate: 14.77, cacInr: 4075 },
      { source: 'Inbound call', leads: 504, activations: 48, activationRate: 9.52, cacInr: 5120 },
      { source: 'Channel partner', leads: 1010, activations: 81, activationRate: 8.02, cacInr: 20915 },
      { source: 'Field sales', leads: 1720, activations: 125, activationRate: 7.27, cacInr: 24280 },
      { source: 'Website form', leads: 995, activations: 43, activationRate: 4.32, cacInr: 6410 },
      { source: 'WhatsApp campaign', leads: 358, activations: 10, activationRate: 2.79, cacInr: 4015 },
    ];

    res.json({
      ok: true,
      data: sources,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Update unclosed lead advisor status & notes.
 */
export async function updateLeadStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { advisorStatus, note } = req.body;

    const lead = await Lead.findById(id);
    if (!lead) {
      return res.status(404).json({ ok: false, error: { code: 'NOT_FOUND', message: 'Lead not found' } });
    }

    if (advisorStatus) lead.advisorStatus = advisorStatus;
    if (note) {
      lead.notes = lead.notes || [];
      lead.notes.push({
        author: req.user._id,
        text: note,
        createdAt: new Date(),
      });
    }

    await lead.save();

    res.json({
      ok: true,
      data: lead,
    });
  } catch (err) {
    next(err);
  }
}
