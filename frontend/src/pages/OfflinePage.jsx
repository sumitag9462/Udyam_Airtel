import { Link } from 'react-router-dom';

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl border border-slate-200 shadow-sm p-8 text-center">
        <div className="w-16 h-16 bg-slate-200 text-slate-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
          📡
        </div>
        <h1 className="text-xl font-bold text-slate-900 mb-2">Offline Mode</h1>
        <p className="text-sm text-slate-600 mb-6">
          Your network connection is currently unavailable. The Udyam One deterministic rules engine and cached catalogues remain operational offline.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-sm shadow-sm transition-all mb-2"
        >
          Check Connectivity & Retry
        </button>
        <Link
          to="/"
          className="block w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-sm transition-all"
        >
          Return to Cached Home
        </Link>
      </div>
    </div>
  );
}
