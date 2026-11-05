import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiRequest } from '../api/client.js';
import { useAuthStore } from '../store/authStore.js';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';

export default function PrivacyCentrePage() {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading: authLoading } = useAuthStore();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteReason, setDeleteReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login?redirect=/account/privacy');
      return;
    }

    if (isAuthenticated) {
      loadOverview();
    }
  }, [isAuthenticated, authLoading, navigate]);

  const loadOverview = async () => {
    try {
      setLoading(true);
      const res = await apiRequest('/me/overview');
      setData(res.data);
    } catch (err) {
      setActionError(err.message || 'Failed to load account privacy details');
    } finally {
      setLoading(false);
    }
  };

  const handleWithdrawConsent = async () => {
    if (!window.confirm('Are you sure you want to withdraw all digital KYC consents? This may pause ongoing automated verification.')) {
      return;
    }
    try {
      setIsSubmitting(true);
      setActionMessage(null);
      setActionError(null);
      await apiRequest('/kyc/consent/withdraw', { method: 'POST' });
      setActionMessage('Your consent has been successfully withdrawn. Automated KYC verification has been halted.');
      await loadOverview();
    } catch (err) {
      setActionError(err.message || 'Failed to withdraw consent');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExportData = async () => {
    try {
      setIsSubmitting(true);
      setActionMessage(null);
      setActionError(null);
      const exportJson = await apiRequest('/me/export');
      const blob = new window.Blob([JSON.stringify(exportJson, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `udyam_one_dpdp_export_${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      setActionMessage('Data portability package downloaded successfully.');
    } catch (err) {
      setActionError(err.message || 'Failed to export personal data');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteRequest = async (e) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      setActionMessage(null);
      setActionError(null);
      const res = await apiRequest('/me/deletion-requests', {
        method: 'POST',
        body: JSON.stringify({ reason: deleteReason }),
      });
      setShowDeleteModal(false);
      setDeleteReason('');
      setActionMessage(res.data?.message || 'Data erasure request submitted successfully.');
      await loadOverview();
    } catch (err) {
      setActionError(err.message || 'Failed to submit erasure request');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="grow max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">🛡️</span>
            <span className="text-xs font-bold text-airtel-red uppercase tracking-wider">
              DPDP Act 2023 Compliance
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900">
            Privacy Centre & Consent Control
          </h1>
          <p className="text-slate-600 text-sm mt-1">
            Manage your personal data, active digital consents, data portability, and erasure rights under India’s Digital Personal Data Protection Act, 2023.
          </p>
        </div>

        {/* Feedback banners */}
        {actionMessage && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center justify-between">
            <span>{actionMessage}</span>
            <button onClick={() => setActionMessage(null)} className="text-emerald-700 font-bold ml-2">×</button>
          </div>
        )}
        {actionError && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm flex items-center justify-between">
            <span>{actionError}</span>
            <button onClick={() => setActionError(null)} className="text-red-700 font-bold ml-2">×</button>
          </div>
        )}

        {loading ? (
          <div className="py-24 text-center">
            <div className="w-10 h-10 border-4 border-airtel-red border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-600 font-medium">Loading privacy configuration...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Account Details & Role */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h2 className="text-lg font-bold text-slate-900 mb-4">Identity & Session Profile</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-xs text-slate-400 block mb-1">Authorized Role</span>
                  <span className="font-semibold text-slate-800 uppercase">{user?.role || 'owner'}</span>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-xs text-slate-400 block mb-1">Masked Mobile</span>
                  <span className="font-semibold text-slate-800">•••• •••• {user?.phoneLast4 || 'XXXX'}</span>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-xs text-slate-400 block mb-1">Enterprise Business</span>
                  <span className="font-semibold text-slate-800">{data?.lead?.businessName || 'SMB Applicant'}</span>
                </div>
              </div>
            </div>

            {/* Consent Management Card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Active Digital Consents</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Purpose limitation: Digital KYC verification and regulatory compliance only.
                  </p>
                </div>
                <span
                  className={`px-3 py-1 text-xs font-semibold rounded-full self-start sm:self-auto ${
                    (data?.activeConsentsCount || 0) > 0
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {data?.activeConsentsCount || 0} Active Consents
                </span>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 mb-6 text-sm text-slate-600 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span><strong>Notice Version:</strong> 1.0.0 (DPDP Act 2023 compliant)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span><strong>Data Minimisation:</strong> Only business proof, GSTIN/Udyam, and signatory ID collected.</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span><strong>Storage Security:</strong> AES-256-GCM encrypted at rest in local secure vault.</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  disabled={isSubmitting || (data?.activeConsentsCount || 0) === 0}
                  onClick={handleWithdrawConsent}
                  className="px-4 py-2 text-sm font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl transition-colors disabled:opacity-50"
                >
                  Withdraw All Consents
                </button>
                <Link
                  to="/privacy"
                  className="text-sm font-medium text-slate-600 hover:text-slate-900 underline"
                >
                  Read Full Notice & Policy →
                </Link>
              </div>
            </div>

            {/* DPDP Statutory Rights (Export & Erasure) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Data Portability */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-lg mb-3">
                    📥
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mb-1">Right to Data Portability</h3>
                  <p className="text-xs text-slate-500 mb-4">
                    Download a complete machine-readable JSON copy of all personal records, order history, quotes, and audit logs.
                  </p>
                </div>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleExportData}
                  className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-xl shadow-xs transition-colors disabled:opacity-50"
                >
                  Download Data Package (JSON)
                </button>
              </div>

              {/* Right to Erasure */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-red-50 text-airtel-red flex items-center justify-center text-lg mb-3">
                    🗑️
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mb-1">Right to Erasure (Deletion)</h3>
                  <p className="text-xs text-slate-500 mb-4">
                    Submit a formal deletion request. Non-statutory personal data will be erased within statutory compliance timelines.
                  </p>
                </div>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setShowDeleteModal(true)}
                  className="w-full py-2.5 px-4 bg-red-50 hover:bg-red-100 text-airtel-red border border-red-200 text-sm font-semibold rounded-xl transition-colors disabled:opacity-50"
                >
                  Request Data Erasure
                </button>
              </div>
            </div>

            {/* Grievance Redressal Banner */}
            <div className="bg-slate-100 rounded-2xl p-6 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Have a privacy concern or grievance?</h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Our dedicated Data Protection Officer (DPO) responds within regulatory statutory timelines.
                </p>
              </div>
              <Link
                to="/grievance"
                className="px-4 py-2 bg-white text-slate-800 font-semibold text-xs rounded-xl border border-slate-300 hover:bg-slate-50 transition-colors shrink-0"
              >
                File DPDP Grievance →
              </Link>
            </div>
          </div>
        )}

        {/* Deletion Request Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
              <h3 className="text-lg font-bold text-slate-900 mb-2">Request Data Erasure</h3>
              <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                Under Section 12 of the DPDP Act 2023, you have the right to request deletion of your personal data. Please note that data required for telecom regulatory records (DoT/TRAI) and financial audit laws must be retained for mandatory statutory periods.
              </p>
              <form onSubmit={handleDeleteRequest} className="space-y-4">
                <div>
                  <label htmlFor="deleteReason" className="block text-xs font-semibold text-slate-700 mb-1">
                    Reason for Deletion (Optional)
                  </label>
                  <textarea
                    id="deleteReason"
                    rows="3"
                    value={deleteReason}
                    onChange={(e) => setDeleteReason(e.target.value)}
                    placeholder="e.g. Business shut down, no longer requiring services..."
                    className="w-full text-sm p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-airtel-red focus:outline-hidden"
                  />
                </div>
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowDeleteModal(false)}
                    className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 text-sm font-bold text-white bg-airtel-red hover:bg-red-700 rounded-xl shadow-xs disabled:opacity-50"
                  >
                    Confirm Erasure Request
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
