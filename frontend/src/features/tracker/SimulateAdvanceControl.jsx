import { useState } from 'react';
import { simulateAdvanceOrder } from './api.js';

export default function SimulateAdvanceControl({ order, onAdvanced }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!order) return null;

  const currentStatus = order.status;
  const isActivated = currentStatus === 'ACTIVATED';

  const handleAdvance = async (targetStatus = null) => {
    setLoading(true);
    setError(null);
    try {
      const updated = await simulateAdvanceOrder(order.orderId, { targetStatus });
      if (onAdvanced) onAdvanced(updated);
    } catch (err) {
      setError(err.message || 'Failed to advance simulation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white rounded-xl p-5 shadow-lg mb-6 border border-gray-700">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">
              Jury Demo • Provisioning Simulator
            </span>
          </div>
          <p className="text-xs text-gray-300 mt-1">
            Simulate optical network line allocation, technician dispatch, and router activation.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {!isActivated ? (
            <button
              type="button"
              disabled={loading}
              onClick={() => handleAdvance()}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition shadow disabled:opacity-50 flex items-center gap-1.5"
            >
              {loading ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  Advancing...
                </>
              ) : (
                '▶ Next Provisioning Stage'
              )}
            </button>
          ) : (
            <span className="text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1.5 rounded-lg font-bold">
              ✓ Fully Activated Live
            </span>
          )}

          {!isActivated && (
            <button
              type="button"
              disabled={loading}
              onClick={() => handleAdvance('ACTIVATED')}
              className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg text-xs font-medium transition"
            >
              Jump to Activated
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="mt-3 p-2 bg-red-900/50 border border-red-700 text-red-200 text-xs rounded">
          {error}
        </div>
      )}
    </div>
  );
}
