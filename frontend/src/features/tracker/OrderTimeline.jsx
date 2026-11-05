const STAGES = [
  {
    key: 'QUOTE_ACCEPTED',
    title: 'Quote Accepted & Commercials Locked',
    desc: 'Contract terms and transparent monthly pricing locked for 7 days.',
  },
  {
    key: 'KYC_VERIFIED',
    title: 'Smart KYC Document Verification',
    desc: '19 regulated checks verified across GSTIN, ID, and utility registries.',
  },
  {
    key: 'FEASIBILITY_CHECK',
    title: 'Premises Fibre Feasibility',
    desc: 'Optical Line Terminal (OLT) port allocation & optical loss verification (simulated).',
  },
  {
    key: 'INSTALL_SCHEDULED',
    title: 'Installation Slot Confirmed',
    desc: 'Airtel field engineering technician assigned for on-site premises cabling.',
  },
  {
    key: 'INSTALLED',
    title: 'CPE Router Installed & Tested',
    desc: 'Airtel Xstream Wi-Fi router linked, spliced to fibre distribution box.',
  },
  {
    key: 'ACTIVATED',
    title: 'Enterprise Broadband Live',
    desc: 'Active high-speed connectivity. Digital invoice generated.',
  },
];

const STAGE_ORDER = STAGES.map((s) => s.key);

export default function OrderTimeline({ order }) {
  if (!order) return null;

  const currentStatus = order.status;
  const currentIdx = STAGE_ORDER.indexOf(currentStatus);

  // Group timeline events by status for fast lookup
  const eventMap = {};
  for (const ev of order.timeline || []) {
    eventMap[ev.status] = ev;
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gray-100 gap-2">
        <div>
          <span className="text-xs uppercase font-bold tracking-wider text-gray-500">Live Delivery Tracker</span>
          <h2 className="text-xl font-bold text-gray-900 mt-0.5">Order {order.orderId}</h2>
        </div>
        <div className="text-right">
          <span className="text-xs text-gray-500 block">Estimated Activation Date (Estimated):</span>
          <span className="text-sm font-bold text-red-600">
            {order.estimatedActivation
              ? new Date(order.estimatedActivation).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                }) + ' (Estimated)'
              : 'Within 5 business days (Estimated)'}
          </span>
        </div>
      </div>

      <div className="mt-2 py-2 px-3 bg-red-50/50 rounded-lg text-xs text-gray-600 border border-red-100/60">
        ℹ️ {order.estimatedActivationReason || 'Estimated installation timeline based on typical fibre pulling and technician availability.'}
      </div>

      {/* Stepper */}
      <div className="mt-8 relative">
        <div className="space-y-8 relative before:absolute before:inset-0 before:left-4 before:h-full before:w-0.5 before:bg-gray-200">
          {STAGES.map((stage, idx) => {
            const isCompleted = idx < currentIdx || (idx === currentIdx && currentStatus === 'ACTIVATED');
            const isCurrent = idx === currentIdx && currentStatus !== 'ACTIVATED';
            const event = eventMap[stage.key];

            return (
              <div key={stage.key} className="relative flex items-start gap-4">
                {/* Circle Icon */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 z-10 transition-colors ${
                    isCompleted
                      ? 'bg-green-600 text-white'
                      : isCurrent
                      ? 'bg-red-600 text-white ring-4 ring-red-100 animate-pulse'
                      : 'bg-white border-2 border-gray-300 text-gray-400'
                  }`}
                >
                  {isCompleted ? '✓' : idx + 1}
                </div>

                {/* Content */}
                <div className="flex-1 pt-1">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <h4
                      className={`font-semibold text-sm ${
                        isCurrent
                          ? 'text-red-600'
                          : isCompleted
                          ? 'text-gray-900'
                          : 'text-gray-400'
                      }`}
                    >
                      {stage.title}
                    </h4>
                    {event?.at && (
                      <span className="text-xs text-gray-400 font-mono">
                        {new Date(event.at).toLocaleDateString('en-IN', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-gray-500 mt-0.5">{stage.desc}</p>

                  {/* Telemetry / Event details */}
                  {event?.note && (
                    <div className="mt-2 text-xs bg-gray-50 p-2.5 rounded-lg border border-gray-100 text-gray-700 flex items-center justify-between">
                      <span>{event.note}</span>
                      {event.simulated && (
                        <span className="text-[10px] bg-amber-100 text-amber-800 font-mono px-1.5 py-0.5 rounded ml-2 shrink-0">
                          simulated
                        </span>
                      )}
                    </div>
                  )}

                  {/* Feasibility telemetrics preview */}
                  {stage.key === 'FEASIBILITY_CHECK' && order.feasibility?.reason && (
                    <div className="mt-1 text-xs text-emerald-700 bg-emerald-50/60 p-2 rounded border border-emerald-100">
                      Telemetry: {order.feasibility.reason}
                    </div>
                  )}

                  {/* Slot confirmation badge */}
                  {stage.key === 'INSTALL_SCHEDULED' && order.selectedSlot?.slotDate && (
                    <div className="mt-1 text-xs text-blue-700 bg-blue-50/60 p-2 rounded border border-blue-100">
                      Confirmed Slot: {new Date(order.selectedSlot.slotDate).toLocaleDateString('en-IN')} (Window: {order.selectedSlot.timeWindow})
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
