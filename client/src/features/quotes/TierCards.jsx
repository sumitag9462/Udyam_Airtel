import { Link } from 'react-router-dom';

export default function TierCards({ tiers, selectedTier, onSelectTier, loading, onExploreDefault, budgetMonthly }) {
  if (!tiers || tiers.length === 0) {
    return (
      <div className="p-8 text-center bg-gray-50 border border-divider rounded-lg max-w-xl mx-auto my-6 space-y-4">
        <div className="w-12 h-12 rounded-full bg-red-50 text-airtel-red flex items-center justify-center mx-auto text-xl font-bold">
          !
        </div>
        <div>
          <h3 className="text-base font-bold text-primary">Personalized Business Setup Required</h3>
          <p className="text-secondary text-xs mt-1.5 leading-relaxed">
            We need a few details about your business (such as type, location, and team size) to calculate eligible Airtel Business bundles and accurate pricing.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Link
            to="/advisor"
            className="btn-primary text-xs py-2.5 px-4 font-semibold inline-block text-center rounded"
          >
            Start Guided Setup →
          </Link>
          {onExploreDefault && (
            <button
              type="button"
              onClick={onExploreDefault}
              className="btn-secondary text-xs py-2.5 px-4 font-semibold rounded"
            >
              Explore Standard Plans
            </button>
          )}
        </div>
      </div>
    );
  }

  const tierMeta = {
    starter: {
      tag: 'Essentials',
      desc: 'High-speed business connectivity for daily digital operations.',
      badgeBg: 'bg-gray-100 text-gray-800',
      why: 'Covers 100 Mbps Biz Fibre (₹999) + requested Cloud Email (₹1,750) and 1TB Backup (₹499). Foundation package.',
    },
    standard: {
      tag: 'Recommended',
      desc: 'Connectivity combined with security, cloud tools, and productivity suite.',
      badgeBg: 'bg-red-50 text-airtel-red border border-red-200',
      why: 'Includes Starter (₹3,248) + Endpoint Security (₹1,386). Comprehensive protection within ₹5,000 budget.',
    },
    resilient: {
      tag: 'High Availability',
      desc: 'Engineered for mission-critical operations with backup redundancy.',
      badgeBg: 'bg-emerald-50 text-emerald-800 border border-emerald-200',
      why: 'Includes Standard (₹4,634) + 4G Auto-Failover (₹499/mo). Zero downtime during fibre cuts. +₹133 over budget.',
    },
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {tiers.map((tier) => {
        const meta = tierMeta[tier.tierLabel] || {
          tag: tier.tierLabel,
          desc: 'Customized business solution bundle.',
          badgeBg: 'bg-gray-100 text-gray-800',
          why: 'Calculated by Airtel rules engine from verified catalogue line items.',
        };
        const isSelected = selectedTier === tier.tierLabel;
        const isOverBudget = budgetMonthly && tier.monthlyTotal > budgetMonthly;
        const budgetDiff = isOverBudget ? tier.monthlyTotal - budgetMonthly : 0;

        return (
          <div
            key={tier.tierLabel}
            className={`flex flex-col justify-between border-2 rounded-lg p-5 transition-all bg-white relative ${
              isSelected
                ? 'border-airtel-red shadow-md ring-1 ring-airtel-red'
                : 'border-divider hover:border-gray-400'
            }`}
          >
            <div>
              <div className="flex justify-between items-start mb-2 gap-1 flex-wrap">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded ${meta.badgeBg}`}>
                  {meta.tag}
                </span>
                {isOverBudget ? (
                  <span className="text-[11px] bg-amber-100 text-amber-900 px-2 py-0.5 rounded font-semibold border border-amber-200">
                    +₹{budgetDiff.toLocaleString('en-IN')}/mo over budget
                  </span>
                ) : budgetMonthly ? (
                  <span className="text-[11px] bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded font-medium border border-emerald-200">
                    Within budget
                  </span>
                ) : null}
                {tier.indicativeOnly && (
                  <span
                    className="text-[11px] bg-amber-100 text-amber-900 px-2 py-0.5 rounded font-medium"
                    title="Site visit or survey required before activation"
                  >
                    Simulated Indicative
                  </span>
                )}
              </div>

              <h3 className="text-xl font-bold text-primary capitalize">{tier.name || tier.tierLabel}</h3>
              <p className="text-xs text-secondary mt-1 min-h-[32px]">{meta.desc}</p>

              <div className="mt-4 pt-4 border-t border-divider">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-primary">
                    ₹{tier.monthlyTotal.toLocaleString('en-IN')}
                  </span>
                  <span className="text-xs text-secondary font-medium">/ month</span>
                </div>
                <div className="mt-2 space-y-1 text-xs text-secondary">
                  <div className="flex justify-between">
                    <span>One-time setup:</span>
                    <span className="font-semibold text-primary">
                      {tier.setupTotal > 0 ? `₹${tier.setupTotal.toLocaleString('en-IN')}` : '₹0 (Free)'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Contract term:</span>
                    <span className="font-semibold text-primary">{tier.contractMonths} months</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-dashed border-divider font-medium">
                    <span>First-year commitment:</span>
                    <span className="text-primary font-bold">
                      ₹{tier.firstYearTotal.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Why this price explanation */}
              <div className="mt-3.5 p-2.5 bg-gray-50 border border-divider rounded text-[11px] text-secondary leading-snug">
                <strong className="text-primary block mb-0.5">Why this price?</strong>
                {meta.why}
              </div>

              {/* Line items preview */}
              <div className="mt-4 pt-3 border-t border-divider">
                <p className="text-xs font-semibold uppercase tracking-wider text-secondary mb-2">
                  Included in this plan:
                </p>
                <ul className="space-y-1.5 text-xs text-primary">
                  {tier.lineItems.map((item) => (
                    <li key={item.productId} className="flex justify-between items-center">
                      <span className="truncate pr-2" title={item.name}>
                        • {item.name}
                      </span>
                      <span className="font-medium text-secondary whitespace-nowrap">
                        {item.qty > 1 ? `x${item.qty}` : ''}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <button
              type="button"
              disabled={loading}
              onClick={() => onSelectTier(tier.tierLabel)}
              className={`mt-6 w-full py-2.5 px-4 rounded text-sm font-semibold transition-colors ${
                isSelected
                  ? 'btn-primary'
                  : 'btn-secondary hover:bg-gray-100'
              }`}
            >
              {isSelected ? '✓ Selected' : 'Select Plan'}
            </button>
          </div>
        );
      })}
    </div>
  );
}
