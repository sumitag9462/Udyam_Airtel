import { Link } from 'react-router-dom';

export default function SessionExpiredPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl border border-slate-200 shadow-sm p-8 text-center">
        <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
          ⏳
        </div>
        <h1 className="text-xl font-bold text-slate-900 mb-2">Session Expired</h1>
        <p className="text-sm text-slate-600 mb-6">
          Your secure authentication session has timed out in accordance with DPDP security standards. Please log in again with OTP or password to resume.
        </p>
        <Link
          to="/login"
          className="block w-full py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-sm shadow-sm transition-all"
        >
          Sign In Again
        </Link>
      </div>
    </div>
  );
}
