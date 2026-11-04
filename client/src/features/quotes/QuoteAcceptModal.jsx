import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { acceptQuote } from './api.js';

export default function QuoteAcceptModal({ quote, isOpen, onClose, onAccepted }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [accepted, setAccepted] = useState(false);

  if (!isOpen) return null;

  const handleConfirmAccept = async () => {
    setError(null);
    setLoading(true);

    try {
      // Generate standard v4 UUID for Idempotency-Key
      const idempotencyKey =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `idemp-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

      const res = await acceptQuote(quote.quoteId, idempotencyKey);
      setAccepted(true);
      if (onAccepted) onAccepted(res.quote);
    } catch (err) {
      if (err.code === 'PRICE_DRIFT') {
        setError('Catalogue pricing has been updated since this draft was generated. Please refresh to load the latest prices.');
      } else {
        setError(err.message || 'Failed to accept quote. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
    >
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 space-y-5 animate-in fade-in">
        {!accepted ? (
          <>
            <div>
              <h3 id="modal-title" className="text-lg font-bold text-primary">
                Accept Quote & Lock Pricing
              </h3>
              <p className="text-xs text-secondary mt-1">
                Once accepted, your quoted pricing is frozen and guaranteed for the next 7 days.
              </p>
            </div>

            <div className="p-4 bg-gray-50 border border-divider rounded-lg space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-secondary">Quote ID:</span>
                <span className="font-bold text-primary">{quote.quoteId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary">Monthly Total:</span>
                <span className="font-bold text-primary">₹{quote.monthlyTotal.toLocaleString('en-IN')} / mo</span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary">One-time Setup:</span>
                <span className="font-bold text-primary">₹{quote.setupTotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary">Contract Duration:</span>
                <span className="font-bold text-primary">{quote.contractMonths} months</span>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-dark-red text-xs rounded">
                {error}
              </div>
            )}

            <div className="text-[11px] text-secondary">
              By accepting this quote, your application will advance to Smart KYC document verification. You will not be charged until verification is complete.
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-divider">
              <button
                type="button"
                disabled={loading}
                onClick={onClose}
                className="btn-secondary text-xs py-2 px-4"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={handleConfirmAccept}
                className="btn-primary text-xs py-2 px-5"
              >
                {loading ? 'Locking Pricing...' : 'Confirm & Proceed'}
              </button>
            </div>
          </>
        ) : (
          <div className="text-center py-4 space-y-4">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto text-2xl font-bold">
              ✓
            </div>
            <div>
              <h3 className="text-lg font-bold text-primary">Quote Accepted!</h3>
              <p className="text-xs text-secondary mt-1">
                Your price of <strong>₹{quote.monthlyTotal.toLocaleString('en-IN')}/mo</strong> is permanently locked.
              </p>
            </div>
            <div className="pt-4 border-t border-divider flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  navigate(`/kyc?quoteId=${quote.quoteId}`);
                }}
                className="btn-primary w-full text-sm font-semibold py-3"
              >
                Proceed to Smart KYC Verification →
              </button>
              <button
                type="button"
                onClick={onClose}
                className="text-xs text-secondary hover:underline py-1"
              >
                Stay on Quote Page
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
