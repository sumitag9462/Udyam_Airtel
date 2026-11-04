export default function TierCards({ tiers, selectedTier, onSelectTier, loading }) {
  if (!tiers || tiers.length === 0) {
    return (
      <div className="p-8 text-center bg-gray-50 border border-divider rounded">
        <p className="text-secondary text-sm">No recommended tiers available for this profile.</p>
      </div>
    );
  }

  const tierMeta = {
    starter: {
      tag: 'Essentials',
      desc: 'High-speed business connectivity for daily digital operations.',
      badgeBg: 'bg-gray-100 text-gray-800',
    },
    standard: {
      tag: 'Recommended',
      desc: 'Connectivity combined with security, cloud tools, and productivity suite.',
      badgeBg: 'bg-red-50 text-airtel-red border border-red-200',
    },
    resilient: {
      tag: 'High Availability',
      desc: 'Engineered for mission-critical operations with backup redundancy.',
      badgeBg: 'bg-emerald-50 text-emerald-800 border border-emerald-200',
    },
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {tiers.map((tier) => {
        const meta = tierMeta[tier.tierLabel] || {
          tag: tier.tierLabel,
          desc: 'Customized business solution bundle.',
          badgeBg: 'bg-gray-100 text-gray-800',
        };
        const isSelected = selectedTier === tier.tierLabel;

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
              <div className="flex justify-between items-start mb-2">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded ${meta.badgeBg}`}>
                  {meta.tag}
                </span>
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

              {/* Line items preview */}
              <div className="mt-5 pt-3 border-t border-divider">
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
