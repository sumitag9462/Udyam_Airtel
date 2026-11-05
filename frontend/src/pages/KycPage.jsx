import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import ConsentNotice from '../features/kyc/ConsentNotice.jsx';
import KycUploader from '../features/kyc/KycUploader.jsx';
import KycStatusCard from '../features/kyc/KycStatusCard.jsx';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';
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

  const handleProceedNext = () => {
    if (quoteId) {
      navigate(`/checkout/${quoteId}`);
    } else {
      navigate('/tracker');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      {/* Main Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8">
        {/* Progress Stepper */}
        <div className="mb-8">
          <div className="flex items-center justify-between max-w-lg mx-auto text-xs font-semibold">
            <div className="flex items-center gap-1.5 text-gray-500">
              <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px] font-bold">✓</span>
              <span>1. Quote Locked</span>
            </div>
            <div className="h-0.5 w-8 bg-airtel-red"></div>
            <div className="flex items-center gap-1.5 text-airtel-red">
              <span className="w-5 h-5 rounded-full bg-airtel-red text-white flex items-center justify-center text-[10px]">2</span>
              <span>2. Smart KYC</span>
            </div>
            <div className="h-0.5 w-8 bg-gray-200"></div>
            <div className="flex items-center gap-1.5 text-gray-400">
              <span className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center text-[10px]">3</span>
              <span>3. Checkout</span>
            </div>
            <div className="h-0.5 w-8 bg-gray-200"></div>
            <div className="flex items-center gap-1.5 text-gray-400">
              <span className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center text-[10px]">4</span>
              <span>4. Installation</span>
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
            quoteId={quoteId}
            onProceedToTracker={handleProceedNext}
          />
        )}
      </main>

      <Footer />
    </div>
  );
}
