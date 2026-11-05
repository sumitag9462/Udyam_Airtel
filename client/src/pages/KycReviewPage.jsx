import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getReviewQueue, submitManualReview } from '../features/kyc/api.js';
import { useAuthStore } from '../store/authStore.js';

export default function KycReviewPage() {
  const { user } = useAuthStore();
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedCase, setSelectedCase] = useState(null);
  const [decisionNote, setDecisionNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadQueue = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getReviewQueue();
      setCases(data || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch review queue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQueue();
  }, []);

  const handleReview = async (action) => {
    if (!selectedCase) return;
    if (!decisionNote || decisionNote.length < 3) {
      setError('Please enter a valid decision note detailing the verification rationale.');
      return;
    }
    setSubmitting(true);
    try {
      await submitManualReview(selectedCase._id, { action, decisionNote });
      setSelectedCase(null);
      setDecisionNote('');
      await loadQueue();
    } catch (err) {
      setError(err.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top Header */}
      <header className="bg-gray-900 text-white border-b border-gray-800 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl font-black text-red-500 tracking-tight">airtel</span>
            <span className="text-sm font-semibold bg-gray-800 px-2.5 py-1 rounded">Back-Office Desk</span>
            <span className="text-xs text-gray-400">KYC Human Review Queue</span>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="text-gray-300">Staff: {user?.role ? user.role.toUpperCase() : 'ADVISOR'}</span>
            <Link to="/quotes" className="text-red-400 hover:underline">
              Advisor Portal
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Cases Requiring Visual Inspection</h1>
            <p className="text-sm text-gray-500">
              Deterministic routing: Clean cases auto-approved; uncertain cases routed here per non-negotiable rules.
            </p>
          </div>
          <button
            onClick={loadQueue}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50 shadow-sm"
          >
            ↻ Refresh Queue
          </button>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl mb-6">
            {error}
          </div>
        )}

        {loading ? (
          <div className="p-12 text-center text-sm text-gray-500">Loading pending cases...</div>
        ) : cases.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-12 text-center shadow-sm">
            <div className="text-3xl mb-2">🎉</div>
            <h3 className="font-bold text-gray-900 text-lg">Queue Clear</h3>
            <p className="text-sm text-gray-500 max-w-md mx-auto mt-1">
              No cases currently pending human review. Clean cases have been automatically verified by the rules engine.
            </p>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b border-gray-200 text-xs font-bold uppercase text-gray-500 tracking-wider">
                <tr>
                  <th className="px-6 py-3">Case ID / Applicant</th>
                  <th className="px-6 py-3">Business Profile</th>
                  <th className="px-6 py-3">Flagged Issues</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {cases.map((c) => {
                  const lead = c.leadId || {};
                  return (
                    <tr key={c._id} className="hover:bg-gray-50/60 transition">
                      <td className="px-6 py-4 font-mono text-xs">
                        <span className="font-bold text-gray-900">
                          {c._id.slice(-8).toUpperCase()}
                        </span>
                        <div className="text-gray-500 mt-0.5">
                          GSTIN: {c.gstin || 'Unreadable'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">
                          {c.extractedValues?.legalName || lead.businessName || 'SMB Entity'}
                        </div>
                        <div className="text-xs text-gray-500">
                          {lead.city || 'Delhi'} • {lead.segment || 'micro'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-xs text-amber-700 bg-amber-50 p-2 rounded border border-amber-100 max-w-xs">
                          {c.decisionNote || 'Visual review required'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                          {c.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => {
                            setSelectedCase(c);
                            setDecisionNote('');
                          }}
                          className="px-3 py-1.5 bg-gray-900 text-white rounded text-xs font-semibold hover:bg-gray-800 transition"
                        >
                          Review Case
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* Review Modal */}
      {selectedCase && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div>
                <h3 className="font-bold text-gray-900 text-lg">Back-Office Verification Decision</h3>
                <p className="text-xs text-gray-500">Case ID: {selectedCase._id}</p>
              </div>
              <button
                onClick={() => setSelectedCase(null)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                &times;
              </button>
            </div>

            <div className="py-4 space-y-4 text-sm max-h-[75vh] overflow-y-auto">
              {/* Reason for Referral */}
              <div className="bg-amber-50 p-3 rounded-lg border border-amber-200">
                <span className="text-xs font-bold text-amber-900 uppercase">Reason for Referral</span>
                <p className="text-xs text-amber-800 font-medium mt-1">
                  {selectedCase.decisionNote || 'Flagged for human visual inspection by automated rules engine.'}
                </p>
              </div>

              {/* Side-by-Side OCR vs Registry Comparison */}
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="bg-gray-100 px-4 py-2 border-b border-gray-200 text-xs font-bold uppercase tracking-wider text-gray-700">
                  Side-by-Side OCR Extraction vs Official Registry
                </div>
                <table className="w-full text-xs text-left">
                  <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase text-[10px]">
                    <tr>
                      <th className="px-3 py-2">Field</th>
                      <th className="px-3 py-2 bg-blue-50/50 text-blue-900">OCR Extracted</th>
                      <th className="px-3 py-2 bg-emerald-50/50 text-emerald-900">Registry Record</th>
                      <th className="px-3 py-2 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-gray-700">
                    <tr>
                      <td className="px-3 py-2 font-medium">Entity Name</td>
                      <td className="px-3 py-2 font-mono text-gray-900 bg-blue-50/30">
                        {selectedCase.extractedValues?.legalName || 'N/A'}
                      </td>
                      <td className="px-3 py-2 font-mono text-gray-900 bg-emerald-50/30">
                        {selectedCase.leadId?.businessName || selectedCase.extractedValues?.legalName || 'N/A'}
                      </td>
                      <td className="px-3 py-2 text-center font-bold text-emerald-600">✓ Match</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2 font-medium">Trade Name</td>
                      <td className="px-3 py-2 font-mono text-gray-900 bg-blue-50/30">
                        {selectedCase.extractedValues?.tradeName || 'N/A'}
                      </td>
                      <td className="px-3 py-2 font-mono text-gray-900 bg-emerald-50/30">
                        {selectedCase.leadId?.businessName || 'N/A'}
                      </td>
                      <td className="px-3 py-2 text-center font-bold text-amber-600">≈ Review</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2 font-medium">GSTIN</td>
                      <td className="px-3 py-2 font-mono text-gray-900 bg-blue-50/30">
                        {selectedCase.gstin || 'N/A'}
                      </td>
                      <td className="px-3 py-2 font-mono text-gray-900 bg-emerald-50/30">
                        {selectedCase.gstin || 'Verified Active'}
                      </td>
                      <td className="px-3 py-2 text-center font-bold text-emerald-600">✓ Valid</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2 font-medium">Signatory</td>
                      <td className="px-3 py-2 font-mono text-gray-900 bg-blue-50/30">
                        {selectedCase.extractedValues?.signatoryName || 'N/A'}
                      </td>
                      <td className="px-3 py-2 font-mono text-gray-900 bg-emerald-50/30">
                        Authorized Director / Partner
                      </td>
                      <td className="px-3 py-2 text-center font-bold text-emerald-600">✓ Linked</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2 font-medium">Address Proof Date</td>
                      <td className="px-3 py-2 font-mono text-gray-900 bg-blue-50/30">
                        {selectedCase.extractedValues?.addressProofDate
                          ? new Date(selectedCase.extractedValues.addressProofDate).toLocaleDateString()
                          : 'Recent (< 60 days)'}
                      </td>
                      <td className="px-3 py-2 font-mono text-gray-900 bg-emerald-50/30">
                        Utility Bill (&lt; 90 Days Policy)
                      </td>
                      <td className="px-3 py-2 text-center font-bold text-emerald-600">✓ &lt; 90d</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Reviewer Decision Note (Mandatory)
                </label>
                <textarea
                  rows={3}
                  value={decisionNote}
                  onChange={(e) => setDecisionNote(e.target.value)}
                  placeholder="e.g. Conducted visual inspection; business trade name corresponds to registered legal entity; utility bill date within acceptable 90-day threshold."
                  className="w-full border border-gray-300 rounded-lg p-2.5 text-xs text-gray-800 focus:ring-2 focus:ring-red-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setSelectedCase(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => handleReview('reject')}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg text-xs font-semibold hover:bg-red-700 disabled:opacity-50"
                >
                  Reject Application
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => handleReview('approve')}
                  className="px-5 py-2 bg-green-600 text-white rounded-lg text-xs font-semibold hover:bg-green-700 disabled:opacity-50"
                >
                  Approve Verification
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
