export default function FunnelChart({ funnelData }) {
  if (!funnelData) return null;

  const { summary, funnel, exits, leakSolutions } = funnelData;

  const funnelColors = [
    'bg-gray-800',
    'bg-red-700',
    'bg-red-600',
    'bg-red-500',
    'bg-orange-500',
    'bg-emerald-600',
  ];

  return (
    <div className="space-y-6">
      {/* Top Commercial KPI Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">
            Baseline Activation
          </span>
          <span className="text-2xl font-black text-gray-900 mt-1 block">
            {summary.activationRate}%
          </span>
          <span className="text-xs text-gray-500 mt-0.5 block">
            {summary.activated} of {summary.totalLeads.toLocaleString()} leads
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">
            Blended CAC
          </span>
          <span className="text-2xl font-black text-red-600 mt-1 block">
            ₹{summary.blendedCacInr?.toLocaleString('en-IN') || '15,053'}
          </span>
          <span className="text-xs text-gray-500 mt-0.5 block">Per active installation</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">
            6-Month Churn
          </span>
          <span className="text-2xl font-black text-gray-900 mt-1 block">
            {summary.blended6mChurnPct || '15.2'}%
          </span>
          <span className="text-xs text-gray-500 mt-0.5 block">Blended post-activation</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">
            Lead-to-Activation
          </span>
          <span className="text-2xl font-black text-gray-900 mt-1 block">
            {summary.avgLeadToActivationDays || '17.6'} Days
          </span>
          <span className="text-xs text-gray-500 mt-0.5 block">Avg ~3 follow-up calls</span>
        </div>
      </div>

      {/* Visual Pipeline Funnel */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Conversion Funnel & Stage Drop-Offs</h3>
            <p className="text-xs text-gray-500">
              Verified ground truth from 5,000 SMB leads (April 1 to June 30, 2026)
            </p>
          </div>
          <span className="text-xs font-mono bg-red-50 text-red-700 px-2.5 py-1 rounded-md font-semibold">
            Overall Conversion: {summary.activationRate}%
          </span>
        </div>

        <div className="mt-6 space-y-4">
          {funnel.map((step, idx) => {
            const barWidth = Math.max(step.pct, 8);
            return (
              <div key={step.stage}>
                <div className="flex items-center justify-between text-xs font-medium mb-1.5">
                  <span className="text-gray-900 font-semibold">{step.stage}</span>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-gray-900">{step.count.toLocaleString()} reached</span>
                    <span className="text-gray-500 font-mono w-12 text-right">({step.pct}%)</span>
                  </div>
                </div>
                <div className="w-full bg-gray-100 h-6 rounded-lg overflow-hidden relative">
                  <div
                    className={`h-full ${funnelColors[idx % funnelColors.length]} rounded-lg transition-all duration-500 flex items-center px-3 text-white text-[11px] font-bold`}
                    style={{ width: `${barWidth}%` }}
                  >
                    {step.pct > 15 && `${step.count.toLocaleString()}`}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Exits Breakdown */}
        {exits && (
          <div className="mt-6 pt-6 border-t border-gray-100">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">
              Drop-offs by Funnel Exit Stage
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                <span className="text-gray-500 block">Lead Exits</span>
                <span className="text-base font-bold text-gray-900">{exits.lead?.toLocaleString()}</span>
                <span className="text-[10px] text-gray-400 block mt-0.5">Unreachable, not interested</span>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                <span className="text-gray-500 block">Contacted Exits</span>
                <span className="text-base font-bold text-gray-900">{exits.contacted?.toLocaleString()}</span>
                <span className="text-[10px] text-gray-400 block mt-0.5">No time for visit, locked</span>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                <span className="text-gray-500 block">Needs Assessed Exits</span>
                <span className="text-base font-bold text-gray-900">{exits.needsAssessed?.toLocaleString()}</span>
                <span className="text-[10px] text-gray-400 block mt-0.5">Price too high, competitor</span>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                <span className="text-gray-500 block">Quote Accepted Exits</span>
                <span className="text-base font-bold text-gray-900">{exits.quoteAccepted?.toLocaleString()}</span>
                <span className="text-[10px] text-gray-400 block mt-0.5">Missing docs, long paper</span>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                <span className="text-gray-500 block">KYC Complete Exits</span>
                <span className="text-base font-bold text-gray-900">{exits.kycComplete?.toLocaleString()}</span>
                <span className="text-[10px] text-gray-400 block mt-0.5">Install delayed &gt; 21d</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* How Udyam One Solves Each Leak */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 mb-1">
          Strategic Leak Elimination: How Udyam One Solves Each Drop-Off
        </h3>
        <p className="text-xs text-gray-500 mb-6">
          Architectural mappings addressing the root causes identified in Airtel Digital Track A
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {leakSolutions?.map((leak, idx) => (
            <div key={idx} className="p-4 rounded-xl border border-gray-200 bg-gray-50/50 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded">
                    LEAK #{idx + 1}: {leak.stage}
                  </span>
                  <span className="text-xs font-bold text-gray-700">
                    {leak.lossCount.toLocaleString()} leads lost ({leak.lossPct})
                  </span>
                </div>
                <div className="text-xs text-gray-600 mb-3">
                  <strong>Root Diagnosis:</strong> {leak.diagnosis}
                </div>
              </div>
              <div className="p-3 bg-white rounded-lg border border-gray-200 text-xs text-gray-800">
                <strong className="text-emerald-700 block mb-0.5">✓ Udyam One Solution:</strong>
                {leak.udyamSolution}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
