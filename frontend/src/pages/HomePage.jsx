import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiRequest } from '../api/client.js';
import { useAuthStore } from '../store/authStore.js';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';

export default function HomePage() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading } = useAuthStore();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login?redirect=/home');
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
      setData(res.data || res);
    } catch (err) {
      setError(err.message || 'Failed to load account overview');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="py-24 text-center">
            <div className="w-10 h-10 border-4 border-airtel-red border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-600 font-medium">Loading your enterprise dashboard...</p>
          </div>
        ) : error ? (
          <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-red-700">
            <h2 className="font-bold text-lg mb-1">Unable to Load Overview</h2>
            <p className="text-sm mb-4">{error}</p>
            <button
              onClick={loadOverview}
              className="px-4 py-2 bg-airtel-red text-white text-sm font-semibold rounded-lg hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Business Identity Banner */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-red-50 text-airtel-red font-black text-2xl flex items-center justify-center shrink-0 border border-red-100">
                  {data?.lead?.businessName ? data.lead.businessName.charAt(0).toUpperCase() : 'U'}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-2xl font-bold text-slate-900">
                      {data?.lead?.businessName || 'SMB Enterprise Hub'}
                    </h1>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 uppercase">
                      {data?.lead?.segment || 'Business'}
                    </span>
                    {data?.lead?.hasGstin && (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        GSTIN Registered
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-500 mt-1">
                    {data?.lead?.city ? `${data.lead.city} · Tier ${data.lead.cityTier} · ` : ''}
                    Account: •••• {data?.user?.phoneLast4 || 'XXXX'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Link
                  to="/account/privacy"
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
                >
                  🛡️ DPDP Privacy
                </Link>
                <Link
                  to="/help"
                  className="px-4 py-2 text-sm font-medium text-slate-700 border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Need Help?
                </Link>
              </div>
            </div>

            {/* Next Recommended Action Card */}
            {data?.nextAction && (
              <div className="bg-gradient-to-r from-red-600 to-rose-700 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div>
                    <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-white/20 uppercase tracking-wider mb-2">
                      Next Step
                    </span>
                    <h2 className="text-2xl font-bold mb-1">{data.nextAction.label}</h2>
                    <p className="text-red-100 text-sm max-w-2xl">{data.nextAction.description}</p>
                  </div>
                  <Link
                    to={data.nextAction.route}
                    className="inline-flex items-center justify-center px-6 py-3 bg-white text-airtel-red font-bold text-sm rounded-xl shadow-lg hover:bg-red-50 transition-all shrink-0"
                  >
                    Continue Now →
                  </Link>
                </div>
              </div>
            )}

            {/* Grid of Key Lifecycle Sections */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Quote Card */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-slate-900 text-lg">Your Solution Quote</h3>
                    <span
                      className={`text-xs px-2.5 py-1 rounded-full font-semibold uppercase ${
                        data?.latestQuote?.status === 'accepted'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-amber-50 text-amber-700'
                      }`}
                    >
                      {data?.latestQuote?.status || 'No quote yet'}
                    </span>
                  </div>

                  {data?.latestQuote ? (
                    <div className="space-y-3">
                      <p className="text-3xl font-extrabold text-slate-900">
                        ₹{data.latestQuote.monthlyTotal.toLocaleString('en-IN')}
                        <span className="text-sm font-normal text-slate-500"> /month</span>
                      </p>
                      <p className="text-xs text-slate-500">
                        Plan: <span className="font-semibold uppercase text-slate-700">{data.latestQuote.tierLabel}</span> · {data.latestQuote.lineItems?.length || 0} items configured
                      </p>
                      <p className="text-xs text-slate-400">
                        Zero price drift guarantee. Rate locked to catalogue.
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500">
                      No active quote found. Start by chatting with our AI Advisor or building a custom package.
                    </p>
                  )}
                </div>

                <div className="pt-6 mt-4 border-t border-slate-100">
                  <Link
                    to={data?.latestQuote ? `/quotes/${data.latestQuote._id}` : '/advisor'}
                    className="text-airtel-red text-sm font-semibold hover:underline inline-flex items-center gap-1"
                  >
                    {data?.latestQuote ? 'View Full Quote Details' : 'Generate Business Quote'} →
                  </Link>
                </div>
              </div>

              {/* KYC Status Card */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-slate-900 text-lg">Smart KYC Verification</h3>
                    <span
                      className={`text-xs px-2.5 py-1 rounded-full font-semibold uppercase ${
                        data?.kycStatus === 'auto_verified'
                          ? 'bg-emerald-50 text-emerald-700'
                          : data?.kycStatus === 'manual_review'
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {data?.kycStatus?.replace(/_/g, ' ') || 'Pending'}
                    </span>
                  </div>

                  <div className="space-y-3 text-sm text-slate-600">
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-600">✓</span>
                      <span>DPDP Active Consents: <strong>{data?.activeConsentsCount || 0}</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-600">✓</span>
                      <span>AES-256 Encrypted Vault at rest</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-2">
                      Automated 19-check verification engine with seamless human officer fallback.
                    </p>
                  </div>
                </div>

                <div className="pt-6 mt-4 border-t border-slate-100">
                  <Link
                    to="/kyc"
                    className="text-airtel-red text-sm font-semibold hover:underline inline-flex items-center gap-1"
                  >
                    Open Smart KYC Portal →
                  </Link>
                </div>
              </div>

              {/* Order Delivery Card */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-slate-900 text-lg">Fiber Delivery Tracker</h3>
                    <span
                      className={`text-xs px-2.5 py-1 rounded-full font-semibold uppercase ${
                        data?.latestOrder?.stage === 'activated'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-blue-50 text-blue-700'
                      }`}
                    >
                      {data?.latestOrder?.stage?.replace(/_/g, ' ') || 'Not ordered'}
                    </span>
                  </div>

                  {data?.latestOrder ? (
                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-slate-800">
                        Order #{data.latestOrder.orderId}
                      </p>
                      <p className="text-xs text-slate-500">
                        Estimated Activation:{' '}
                        <strong>
                          {new Date(data.latestOrder.estimatedActivationDate).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </strong>
                      </p>
                      <p className="text-xs text-slate-400">
                        Real-time optical telemetry & technician slot scheduling.
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500">
                      Once your quote is accepted and KYC is submitted, your dedicated fiber link order will appear here.
                    </p>
                  )}
                </div>

                <div className="pt-6 mt-4 border-t border-slate-100">
                  <Link
                    to={data?.latestOrder ? `/tracker?orderId=${data.latestOrder._id}` : '/tracker'}
                    className="text-airtel-red text-sm font-semibold hover:underline inline-flex items-center gap-1"
                  >
                    Open Live Delivery Tracker →
                  </Link>
                </div>
              </div>
            </div>

            {/* Recent Notifications & Activity */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h3 className="font-bold text-slate-900 text-lg mb-4">Recent Updates & Dispatches</h3>
              {data?.recentNotifications && data.recentNotifications.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {data.recentNotifications.map((notif, idx) => (
                    <div key={idx} className="py-3 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-xs font-bold uppercase">
                          {notif.channel}
                        </span>
                        <div>
                          <p className="text-sm font-medium text-slate-800">
                            Template: <span className="text-slate-600">{notif.template}</span>
                          </p>
                          <p className="text-xs text-slate-400">Sent to {notif.toMasked}</p>
                        </div>
                      </div>
                      <span className="text-xs text-slate-400">
                        {new Date(notif.sentAt).toLocaleTimeString('en-IN', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500">No recent notifications logged.</p>
              )}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
