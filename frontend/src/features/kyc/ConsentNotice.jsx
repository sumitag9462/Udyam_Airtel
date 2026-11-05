import { useState } from 'react';
import { recordConsent, withdrawConsent } from './api.js';

export default function ConsentNotice({ onConsentGranted, activeConsentId, onConsentWithdrawn }) {
  const [agreed, setAgreed] = useState(Boolean(activeConsentId));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleGrantConsent = async () => {
    if (!agreed) {
      setError('Please acknowledge and check the consent box to proceed');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await recordConsent({
        noticeVersion: '1.0',
        purposes: ['identity_verification', 'telecom_activation', 'regulatory_compliance'],
        documentTypes: ['gst_certificate', 'udyam_certificate', 'signatory_id', 'address_proof'],
      });
      onConsentGranted(data.consentId);
    } catch (err) {
      setError(err.message || 'Failed to record consent');
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!window.confirm('Are you sure you want to withdraw your KYC consent? Any pending verification will be suspended.')) {
      return;
    }
    setLoading(true);
    try {
      await withdrawConsent({ consentId: activeConsentId });
      setAgreed(false);
      onConsentWithdrawn();
    } catch (err) {
      setError(err.message || 'Failed to withdraw consent');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm mb-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-600 font-bold">
            DPDP
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 text-lg">
              Digital Personal Data Protection (DPDP) Notice
            </h3>
            <p className="text-xs text-gray-500">Notice Version 1.0 • Purpose Limitation & Minimisation Enforced</p>
          </div>
        </div>
        {activeConsentId && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            ✓ Active Consent
          </span>
        )}
      </div>

      <div className="mt-4 text-sm text-gray-600 space-y-2 bg-gray-50 p-4 rounded-lg border border-gray-100">
        <p>
          <strong>Purposes of Processing:</strong> Your documents are collected solely for verifying your business identity and activating Airtel enterprise telecommunication services under TRAI & DoT regulations.
        </p>
        <p>
          <strong>Data Minimisation:</strong> We collect only: (1) GSTIN certificate, (2) Signatory photo ID, (3) Recent utility address proof, and (4) Udyam certificate (optional). No unnecessary biometric or financial records are requested.
        </p>
        <p>
          <strong>Encryption & Retention:</strong> All uploads are encrypted using AES-256-GCM. Ineligible documents are purged after 30 days; verified customer documents are retained for 180 days per regulatory guidelines.
        </p>
        <p className="text-xs text-gray-500 pt-1">
          You have the statutory right to withdraw consent at any time. Withdrawal terminates further verification and queues your stored documents for secure erasure.
        </p>
      </div>

      {error && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
          {error}
        </div>
      )}

      <div className="mt-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {!activeConsentId ? (
          <>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="w-4 h-4 text-red-600 rounded border-gray-300 focus:ring-red-500"
              />
              <span className="text-sm text-gray-700 font-medium">
                I give explicit consent for automated verification of my business documents
              </span>
            </label>
            <button
              type="button"
              onClick={handleGrantConsent}
              disabled={loading || !agreed}
              className="px-5 py-2.5 bg-red-600 text-white font-medium rounded-lg text-sm hover:bg-red-700 disabled:opacity-50 transition shadow-sm w-full sm:w-auto"
            >
              {loading ? 'Recording Consent...' : 'Grant Consent & Continue'}
            </button>
          </>
        ) : (
          <div className="w-full flex items-center justify-between">
            <span className="text-sm text-gray-600">
              Consent recorded on this session. You may withdraw at any time.
            </span>
            <button
              type="button"
              onClick={handleWithdraw}
              disabled={loading}
              className="text-sm text-red-600 hover:text-red-700 font-medium underline"
            >
              {loading ? 'Withdrawing...' : 'Withdraw Consent'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
