export default function CommercialCards({ segments, sources }) {
  if (!segments || !sources) return null;

  return (
    <div className="space-y-6">
      {/* Segment Commercial Breakdown */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <div className="pb-4 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-900">SMB Segment Unit Economics</h3>
          <p className="text-xs text-gray-500">
            Activation rate, Customer Acquisition Cost (CAC), and 6-month churn across the 4 verified target segments
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          {segments.map((seg) => (
            <div key={seg.segment} className="p-4 rounded-xl border border-gray-200 bg-gray-50/50 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-gray-900 text-sm">{seg.name}</h4>
                  <span className="text-xs font-black bg-red-100 text-red-800 px-2 py-0.5 rounded">
                    {seg.activationRate}% Conv.
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1 mb-3">{seg.description}</p>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-3 border-t border-gray-200 text-xs">
                <div>
                  <span className="text-gray-400 block text-[10px] uppercase">Avg CAC</span>
                  <span className="font-bold text-gray-900">₹{seg.avgCacInr?.toLocaleString('en-IN')}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px] uppercase">Monthly ARPU</span>
                  <span className="font-bold text-gray-900">₹{seg.avgMonthlySpendInr?.toLocaleString('en-IN')}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px] uppercase">6m Churn</span>
                  <span className="font-bold text-emerald-700">{seg.churn6mPct}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Acquisition Channel Breakdown */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <div className="pb-4 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-900">Acquisition Channel Efficiency</h3>
          <p className="text-xs text-gray-500">
            Field sales vs Digital vs Inbound performance across 5,000 historical leads
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-6">
          {sources.map((src) => (
            <div key={src.source} className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex flex-col justify-between text-xs">
              <div>
                <span className="font-bold text-gray-900 block truncate">{src.source}</span>
                <span className="text-[11px] text-gray-500 block">{src.leads} leads</span>
              </div>
              <div className="mt-3 pt-2 border-t border-gray-200">
                <span className="font-black text-sm text-red-600 block">{src.activationRate}%</span>
                <span className="text-[10px] text-gray-500">CAC: ₹{src.cacInr.toLocaleString('en-IN')}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
