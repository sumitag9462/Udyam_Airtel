import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import FunnelChart from '../features/backoffice/FunnelChart.jsx';
import UnclosedLeadsTable from '../features/backoffice/UnclosedLeadsTable.jsx';
import CommercialCards from '../features/backoffice/CommercialCards.jsx';
import {
  getFunnelMetrics,
  getUnclosedLeads,
  getSegmentAnalytics,
  getSourceAnalytics,
} from '../features/backoffice/api.js';
import { useAuthStore } from '../store/authStore.js';

export default function BackOfficeDashboard() {
  const { user } = useAuthStore();
  const [tab, setTab] = useState('funnel'); // 'funnel' | 'unclosed' | 'commercials'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [funnelData, setFunnelData] = useState(null);
  const [leadsData, setLeadsData] = useState(null);
  const [segments, setSegments] = useState([]);
  const [sources, setSources] = useState([]);

  const loadAllData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [fData, lData, segData, srcData] = await Promise.all([
        getFunnelMetrics('seed'),
        getUnclosedLeads({ limit: 50 }),
        getSegmentAnalytics(),
        getSourceAnalytics(),
      ]);
      setFunnelData(fData);
      setLeadsData(lData);
      setSegments(segData);
      setSources(srcData);
    } catch (err) {
      setError(err.message || 'Failed to load back-office analytics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top Navigation */}
      <header className="bg-gray-900 text-white border-b border-gray-800 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl font-black text-red-500 tracking-tight">airtel</span>
            <span className="text-sm font-bold bg-gray-800 px-2.5 py-1 rounded">Executive Back-Office</span>
            <span className="text-xs text-gray-400">Digital Track A Command Center</span>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="text-gray-300">Role: {user?.role ? user.role.toUpperCase() : 'ADVISOR / ADMIN'}</span>
            <Link to="/backoffice/kyc-queue" className="text-amber-400 hover:underline">
              KYC Review Queue →
            </Link>
            <Link to="/quotes" className="text-red-400 hover:underline">
              Advisor Portal
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Udyam One Funnel Analytics & Recovery</h1>
            <p className="text-xs text-gray-500">
              Live funnel performance, drop-off leak resolution, and propensity-scored unclosed leads
            </p>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center bg-gray-200 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setTab('funnel')}
              className={`px-4 py-2 rounded-lg transition ${
                tab === 'funnel' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Funnel & Leaks
            </button>
            <button
              onClick={() => setTab('unclosed')}
              className={`px-4 py-2 rounded-lg transition ${
                tab === 'unclosed' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Unclosed Leads Queue
            </button>
            <button
              onClick={() => setTab('commercials')}
              className={`px-4 py-2 rounded-lg transition ${
                tab === 'commercials' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Unit Economics
            </button>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl mb-6">
            {error}
          </div>
        )}

        {loading ? (
          <div className="p-16 text-center text-sm text-gray-500">
            <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            Loading executive funnel intelligence & machine learning scores...
          </div>
        ) : (
          <>
            {tab === 'funnel' && <FunnelChart funnelData={funnelData} />}
            {tab === 'unclosed' && (
              <UnclosedLeadsTable
                leadsData={leadsData}
                onLeadUpdated={loadAllData}
              />
            )}
            {tab === 'commercials' && (
              <CommercialCards segments={segments} sources={sources} />
            )}
          </>
        )}
      </main>
    </div>
  );
}
