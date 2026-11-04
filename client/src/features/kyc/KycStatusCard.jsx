import { useState } from 'react';
import CheckListModal from './CheckListModal.jsx';

export default function KycStatusCard({ result, onProceedToTracker }) {
  const [showChecks, setShowChecks] = useState(false);

  if (!result) return null;

  const { status, verdict, summary, checks, extractedValues, retentionDays } = result;

  const isVerified = status === 'verified' || verdict === 'auto_approved';
  const isInReview = status === 'in_review' || verdict === 'requires_review';
  const isRejected = status === 'rejected';

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gray-100 gap-3">
        <div>
          <span className="text-xs uppercase font-bold tracking-wider text-gray-500">Verification Outcome</span>
          <h3 className="text-xl font-bold text-gray-900 mt-0.5">
            {isVerified && '✓ Instant KYC Verification Approved'}
            {isInReview && '⏳ Document Forwarded to Human Review Queue'}
            {isRejected && '✗ KYC Verification Ineligible / Rejected'}
          </h3>
        </div>
        <span
          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
            isVerified
              ? 'bg-green-100 text-green-800'
              : isInReview
              ? 'bg-amber-100 text-amber-800'
              : 'bg-red-100 text-red-800'
          }`}
        >
          {isVerified ? 'AUTO-APPROVED' : isInReview ? 'NEEDS HUMAN REVIEW' : 'REJECTED'}
        </span>
      </div>

      <p className="mt-4 text-sm text-gray-700 bg-gray-50 p-3.5 rounded-lg border border-gray-100">
        {summary}
      </p>

      {/* Extracted Values Display */}
      {extractedValues && (
        <div className="mt-4 p-4 rounded-xl border border-gray-100 bg-gray-50/50">
          <h4 className="text-xs font-bold uppercase text-gray-500 tracking-wider mb-2">
            Verified Entity Details (Auto-extracted)
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 text-xs">
            <div>
              <span className="text-gray-500">Legal Entity: </span>
              <span className="font-semibold text-gray-900">{extractedValues.legalName || 'N/A'}</span>
            </div>
            <div>
              <span className="text-gray-500">Trade Name: </span>
              <span className="font-semibold text-gray-900">{extractedValues.tradeName || 'N/A'}</span>
            </div>
            <div>
              <span className="text-gray-500">Signatory: </span>
              <span className="font-semibold text-gray-900">{extractedValues.signatoryName || 'N/A'}</span>
            </div>
            <div>
              <span className="text-gray-500">Address Proof Date: </span>
              <span className="font-semibold text-gray-900">
                {extractedValues.addressProofDate
                  ? new Date(extractedValues.addressProofDate).toLocaleDateString()
                  : 'N/A'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* DPDP Retention Schedule */}
      <div className="mt-3 text-xs text-gray-500 flex items-center justify-between">
        <span>
          DPDP Retention TTL: Encrypted records scheduled for purge in {retentionDays || (isRejected ? 30 : 180)} days
        </span>
        <button
          type="button"
          onClick={() => setShowChecks(true)}
          className="text-red-600 hover:text-red-700 font-medium underline"
        >
          Inspect 19 Regulated Checks ({checks?.length || 19}) →
        </button>
      </div>

      {/* Action buttons */}
      <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-gray-100">
        <button
          type="button"
          onClick={() => setShowChecks(true)}
          className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50 transition"
        >
          View Full Audit Checks
        </button>

        {isVerified && (
          <button
            type="button"
            onClick={onProceedToTracker}
            className="w-full sm:w-auto px-6 py-2.5 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 transition shadow-sm"
          >
            Track Order & Installation →
          </button>
        )}

        {isInReview && (
          <div className="text-xs text-amber-700 font-medium">
            Airtel back-office advisor is reviewing your case. Check back shortly.
          </div>
        )}

        {isRejected && (
          <div className="text-xs text-red-700 font-medium">
            Contact Airtel SMB advisor or re-upload valid active documents.
          </div>
        )}
      </div>

      {showChecks && <CheckListModal checks={checks} onClose={() => setShowChecks(false)} />}
    </div>
  );
}
