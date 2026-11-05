import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import Landing from './pages/Landing.jsx';
import Login from './features/auth/Login.jsx';
import QuotePage from './pages/QuotePage.jsx';
import AdvisorPage from './pages/AdvisorPage.jsx';
import KycPage from './pages/KycPage.jsx';
import KycReviewPage from './pages/KycReviewPage.jsx';
import TrackerPage from './pages/TrackerPage.jsx';
import BackOfficeDashboard from './pages/BackOfficeDashboard.jsx';
import HomePage from './pages/HomePage.jsx';
import PrivacyCentrePage from './pages/PrivacyCentrePage.jsx';
import HelpFaqPage from './pages/HelpFaqPage.jsx';
import HowItWorksPage from './pages/HowItWorksPage.jsx';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage.jsx';
import GrievancePage from './pages/GrievancePage.jsx';
import CheckoutPage from './pages/CheckoutPage.jsx';
import PartnerDashboard from './pages/PartnerDashboard.jsx';
import ForbiddenPage from './pages/ForbiddenPage.jsx';
import SessionExpiredPage from './pages/SessionExpiredPage.jsx';
import OfflinePage from './pages/OfflinePage.jsx';
import NotFound from './pages/NotFound.jsx';
import { useAuthStore } from './store/authStore.js';

export default function App() {
  const { checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          {/* ── Public Information Routes (Section 25.1) ────────────────── */}
          <Route path="/" element={<Landing />} />
          <Route path="/how-it-works" element={<HowItWorksPage />} />
          <Route path="/help" element={<HelpFaqPage />} />
          <Route path="/faq" element={<HelpFaqPage />} />
          <Route path="/privacy" element={<PrivacyPolicyPage />} />
          <Route path="/terms" element={<PrivacyPolicyPage />} />
          <Route path="/grievance" element={<GrievancePage />} />
          <Route path="/forbidden" element={<ForbiddenPage />} />
          <Route path="/session-expired" element={<SessionExpiredPage />} />
          <Route path="/offline" element={<OfflinePage />} />

          {/* ── Authentication Routes (Section 25.1) ─────────────────────── */}
          <Route path="/login" element={<Login />} />
          <Route path="/login/verify" element={<Login />} />
          <Route path="/staff/login" element={<Login />} />
          <Route path="/staff/change-password" element={<PrivacyCentrePage />} />

          {/* ── Business Owner Journey Routes (Section 25.2) ─────────────── */}
          <Route path="/home" element={<HomePage />} />
          <Route path="/onboarding" element={<AdvisorPage />} />
          <Route path="/advisor" element={<AdvisorPage />} />
          <Route path="/advisor/:sessionId" element={<AdvisorPage />} />
          <Route path="/chat" element={<AdvisorPage />} />
          <Route path="/recommendations/:sessionId" element={<QuotePage />} />
          <Route path="/quotes" element={<QuotePage />} />
          <Route path="/quotes/:id" element={<QuotePage />} />
          <Route path="/quotes/:quoteId/preview" element={<QuotePage />} />
          <Route path="/quotes/:quoteId/consent" element={<KycPage />} />
          <Route path="/checkout/:quoteId" element={<CheckoutPage />} />
          <Route path="/kyc" element={<KycPage />} />
          <Route path="/kyc/:caseId" element={<KycPage />} />
          <Route path="/kyc/:caseId/results" element={<KycPage />} />
          <Route path="/tracker" element={<TrackerPage />} />
          <Route path="/orders" element={<TrackerPage />} />
          <Route path="/orders/:id" element={<TrackerPage />} />
          <Route path="/orders/:orderId/help" element={<TrackerPage />} />
          <Route path="/notifications" element={<HomePage />} />
          <Route path="/account" element={<PrivacyCentrePage />} />
          <Route path="/account/privacy" element={<PrivacyCentrePage />} />
          <Route path="/account/security" element={<PrivacyCentrePage />} />

          {/* ── Role-Gated Admin & Back-Office Routes (Section 25.3) ─────── */}
          <Route path="/backoffice" element={<BackOfficeDashboard />} />
          <Route path="/backoffice/kyc-queue" element={<KycReviewPage />} />
          <Route path="/admin" element={<BackOfficeDashboard />} />
          <Route path="/admin/leads" element={<BackOfficeDashboard />} />
          <Route path="/admin/leads/:id" element={<BackOfficeDashboard />} />
          <Route path="/admin/kyc" element={<KycReviewPage />} />
          <Route path="/admin/orders" element={<BackOfficeDashboard />} />
          <Route path="/admin/catalogue" element={<BackOfficeDashboard />} />
          <Route path="/admin/users" element={<BackOfficeDashboard />} />
          <Route path="/admin/audit" element={<BackOfficeDashboard />} />
          <Route path="/admin/settings" element={<BackOfficeDashboard />} />

          {/* ── Partner Portal Routes (Section 25.4) ─────────────────────── */}
          <Route path="/partner" element={<PartnerDashboard />} />
          <Route path="/partner/tasks/:id" element={<PartnerDashboard />} />

          {/* ── Fallback ─────────────────────────────────────────────────── */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
