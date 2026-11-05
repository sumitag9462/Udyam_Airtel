import { useState } from 'react';
import { apiRequest } from '../api/client.js';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';

export default function GrievancePage() {
  const [formData, setFormData] = useState({
    category: 'consent_withdrawal',
    details: '',
    contactPhone: '',
    contactEmail: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ticketResult, setTicketResult] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      setError(null);
      const res = await apiRequest('/grievances', {
        method: 'POST',
        body: JSON.stringify(formData),
      });
      setTicketResult(res.data);
    } catch (err) {
      setError(err.message || 'Failed to submit grievance');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="grow max-w-2xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-10 shadow-xs">
          <div className="mb-6">
            <span className="text-xs font-bold text-airtel-red uppercase tracking-wider">
              Statutory Redressal
            </span>
            <h1 className="text-2xl font-bold text-slate-900 mt-1 mb-2">
              File a DPDP or Service Grievance
            </h1>
            <p className="text-xs text-slate-500 leading-relaxed">
              In accordance with Section 13 of the Digital Personal Data Protection Act, 2023, you have the right to register concerns regarding consent revocation, data correction, or service compliance.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}

          {ticketResult ? (
            <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-900 space-y-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-2xl font-bold">
                ✓
              </div>
              <h2 className="text-xl font-bold">Grievance Registered Successfully</h2>
              <div className="p-4 bg-white/80 rounded-xl space-y-1 text-sm border border-emerald-100">
                <p>
                  <strong>Ticket ID:</strong>{' '}
                  <span className="font-mono text-emerald-800 font-bold">{ticketResult.ticketId}</span>
                </p>
                <p>
                  <strong>Assigned Desk:</strong> {ticketResult.officerAssigned}
                </p>
                <p>
                  <strong>Status:</strong>{' '}
                  <span className="capitalize font-semibold">{ticketResult.status}</span>
                </p>
              </div>
              <p className="text-xs text-emerald-800 leading-relaxed">
                {ticketResult.message}
              </p>
              <button
                type="button"
                onClick={() => {
                  setTicketResult(null);
                  setFormData({
                    category: 'consent_withdrawal',
                    details: '',
                    contactPhone: '',
                    contactEmail: '',
                  });
                }}
                className="inline-block px-4 py-2 bg-emerald-700 text-white text-xs font-bold rounded-xl hover:bg-emerald-800 transition-colors"
              >
                Submit Another Request
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="category" className="block text-xs font-semibold text-slate-700 mb-1">
                  Grievance Category *
                </label>
                <select
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full text-sm p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-airtel-red focus:outline-hidden bg-white"
                  required
                >
                  <option value="consent_withdrawal">Consent Revocation / Withdrawal</option>
                  <option value="data_correction">Data Correction or Updating</option>
                  <option value="erasure">Personal Data Erasure Request</option>
                  <option value="service_delay">Installation / Provisioning Delay</option>
                  <option value="billing">Quote or Billing Discrepancy</option>
                  <option value="other">Other Grievance</option>
                </select>
              </div>

              <div>
                <label htmlFor="details" className="block text-xs font-semibold text-slate-700 mb-1">
                  Detailed Description *
                </label>
                <textarea
                  id="details"
                  rows="4"
                  value={formData.details}
                  onChange={(e) => setFormData({ ...formData, details: e.target.value })}
                  placeholder="Describe your issue or concern in detail (min 10 characters)..."
                  className="w-full text-sm p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-airtel-red focus:outline-hidden"
                  required
                  minLength={10}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="contactPhone" className="block text-xs font-semibold text-slate-700 mb-1">
                    Contact Mobile (Optional)
                  </label>
                  <input
                    type="tel"
                    id="contactPhone"
                    value={formData.contactPhone}
                    onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                    placeholder="10-digit mobile"
                    className="w-full text-sm p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-airtel-red focus:outline-hidden"
                  />
                </div>
                <div>
                  <label htmlFor="contactEmail" className="block text-xs font-semibold text-slate-700 mb-1">
                    Contact Email (Optional)
                  </label>
                  <input
                    type="email"
                    id="contactEmail"
                    value={formData.contactEmail}
                    onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                    placeholder="name@business.com"
                    className="w-full text-sm p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-airtel-red focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 px-4 bg-airtel-red hover:bg-red-700 text-white font-bold text-sm rounded-xl shadow-xs transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Submitting Grievance...' : 'Submit Grievance to DPO'}
                </button>
              </div>
            </form>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
