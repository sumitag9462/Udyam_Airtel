import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import ConsentNotice from '../features/kyc/ConsentNotice.jsx';
import KycUploader from '../features/kyc/KycUploader.jsx';
import KycStatusCard from '../features/kyc/KycStatusCard.jsx';
import { useAuthStore } from '../store/authStore.js';

export default function KycPage() {
  const [searchParams] = useSearchParams();
  const quoteId = searchParams.get('quoteId') || null;
  const leadId = searchParams.get('leadId') || null;
  const navigate = useNavigate();

  const { user } = useAuthStore();
  const [consentId, setConsentId] = useState(null);
  const [kycResult, setKycResult] = useState(null);

  const handleConsentGranted = (id) => {
    setConsentId(id);
  };

  const handleConsentWithdrawn = () => {
    setConsentId(null);
    setKycResult(null);
  };

  const handleUploadSuccess = (result) => {
    setKycResult(result);
  };

  const handleProceedToTracker = () => {
    navigate(`/tracker?quoteId=${quoteId || ''}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top Navigation */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-xl font-black text-red-600 tracking-tight">airtel</span>
            <span className="text-sm font-bold bg-gray-900 text-white px-2 py-0.5 rounded">Udyam One</span>
          </Link>
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span>Logged in: {user?.phoneLast4 ? `•••• ${user.phoneLast4}` : 'SMB Owner'}</span>
            <Link to="/quotes" className="text-red-600 hover:underline">
              ← Back to Quote
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8">
        {/* Progress Stepper */}
        <div className="mb-8">
          <div className="flex items-center justify-between max-w-md mx-auto text-xs font-semibold">
            <div className="flex items-center gap-1.5 text-gray-400">
              <span className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center text-[10px]">✓</span>
              <span>1. Quote</span>
            </div>
            <div className="h-0.5 w-8 bg-red-600"></div>
            <div className="flex items-center gap-1.5 text-red-600">
              <span className="w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center text-[10px]">2</span>
              <span>2. Smart KYC</span>
            </div>
            <div className="h-0.5 w-8 bg-gray-200"></div>
            <div className="flex items-center gap-1.5 text-gray-400">
              <span className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center text-[10px]">3</span>
              <span>3. Installation</span>
            </div>
          </div>
        </div>

        {/* Step 1: DPDP Explicit Consent */}
        <ConsentNotice
          activeConsentId={consentId}
          onConsentGranted={handleConsentGranted}
          onConsentWithdrawn={handleConsentWithdrawn}
        />

        {/* Step 2: Document Uploader */}
        <KycUploader
          consentId={consentId}
          quoteId={quoteId}
          leadId={leadId}
          onUploadSuccess={handleUploadSuccess}
        />

        {/* Step 3: Verification Result Status */}
        {kycResult && (
          <KycStatusCard
            result={kycResult}
            onProceedToTracker={handleProceedToTracker}
          />
        )}
      </main>
    </div>
  );
}
