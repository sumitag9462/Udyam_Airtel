import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/authStore.js';
import { apiRequest } from '../../api/client.js';
import Navbar from '../../components/Navbar.jsx';
import Footer from '../../components/Footer.jsx';

export default function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, requestOtp, verifyOtp, staffLogin } = useAuthStore();

  const [activeTab, setActiveTab] = useState('owner'); // 'owner' | 'staff'
  const [phone, setPhone] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [countdown, setCountdown] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [devOutboxCode, setDevOutboxCode] = useState('');

  // Staff state
  const [staffEmail, setStaffEmail] = useState('');
  const [staffPassword, setStaffPassword] = useState('');

  const otpInputsRef = useRef([]);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      const dest = location.state?.from || (user.role === 'owner' ? '/quotes' : '/backoffice');
      navigate(dest, { replace: true });
    }
  }, [isAuthenticated, user, navigate, location.state]);

  // Cooldown countdown timer
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  // Request OTP handler
  const handleRequestOtp = async (e) => {
    e?.preventDefault();
    setError('');
    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    if (cleanPhone.length !== 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }

    try {
      setLoading(true);
      const res = await requestOtp(cleanPhone);
      setOtpSent(true);
      setCountdown(res?.cooldownSeconds || 60);
      // Focus first OTP input
      setTimeout(() => otpInputsRef.current[0]?.focus(), 100);

      // In dev mode, check dev outbox
      fetchDevOutbox();
    } catch (err) {
      setError(err.message || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch latest OTP from outbox for quick testing
  const fetchDevOutbox = async () => {
    try {
      const data = await apiRequest('/dev/outbox');
      if (data?.notifications?.length > 0) {
        const latest = data.notifications.find((n) => n.template === 'login_otp');
        if (latest?.payload?.code) {
          setDevOutboxCode(latest.payload.code);
        }
      }
    } catch {
      // Ignore in production or if disabled
    }
  };

  const handleAutofillDevOtp = () => {
    if (devOutboxCode && devOutboxCode.length === 6) {
      const digits = devOutboxCode.split('');
      setOtp(digits);
      otpInputsRef.current[5]?.focus();
    }
  };

  // Handle OTP digit entry
  const handleOtpChange = (index, value) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);

    // Auto-advance
    if (digit && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length > 0) {
      const newOtp = [...otp];
      for (let i = 0; i < pasted.length; i++) {
        newOtp[i] = pasted[i];
      }
      setOtp(newOtp);
      const nextIndex = Math.min(pasted.length, 5);
      otpInputsRef.current[nextIndex]?.focus();
    }
  };

  // Verify OTP handler
  const handleVerifyOtp = async (e) => {
    e?.preventDefault();
    setError('');
    const code = otp.join('');
    if (code.length !== 6) {
      setError('Please enter the complete 6-digit OTP.');
      return;
    }

    try {
      setLoading(true);
      const activeConversationId = sessionStorage.getItem('udyam_advisor_conversationId');
      const activeSessionSecret = sessionStorage.getItem('udyam_advisor_sessionSecret');
      await verifyOtp(phone, code, {
        conversationId: activeConversationId || undefined,
        sessionSecret: activeSessionSecret || undefined,
      });
      const dest = location.state?.from || '/quotes';
      navigate(dest, { state: location.state });
    } catch (err) {
      setError(err.message || 'Invalid OTP code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Staff login handler
  const handleStaffLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!staffEmail || !staffPassword) {
      setError('Please provide email and password.');
      return;
    }

    try {
      setLoading(true);
      const res = await staffLogin(staffEmail, staffPassword);
      if (res.user.role === 'owner') {
        navigate('/quotes');
      } else {
        navigate('/backoffice');
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-between">
      <Navbar />
      <main className="container-mobile py-12 flex-1 w-full">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-primary">
          <span className="text-airtel-red">Airtel</span> Udyam One
        </h1>
        <p className="text-sm text-secondary mt-1">
          {t('auth.loginSubtitle', 'Sign in to access your business connectivity portal')}
        </p>
      </div>

      {/* Role Switcher Tabs */}
      <div className="flex border-b border-divider mb-6" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'owner'}
          className={`flex-1 py-3 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'owner'
              ? 'border-airtel-red text-airtel-red'
              : 'border-transparent text-secondary hover:text-primary'
          }`}
          onClick={() => {
            setActiveTab('owner');
            setError('');
          }}
        >
          {t('auth.businessOwnerTab', 'Business Owner')}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'staff'}
          className={`flex-1 py-3 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'staff'
              ? 'border-airtel-red text-airtel-red'
              : 'border-transparent text-secondary hover:text-primary'
          }`}
          onClick={() => {
            setActiveTab('staff');
            setError('');
          }}
        >
          {t('auth.staffTab', 'Airtel Staff')}
        </button>
      </div>

      {error && (
        <div
          role="alert"
          aria-live="assertive"
          className="mb-6 p-3 bg-red-50 border border-red-200 text-dark-red text-sm rounded"
        >
          {error}
        </div>
      )}

      {/* Owner Phone + OTP Form */}
      {activeTab === 'owner' && (
        <div className="space-y-6">
          {!otpSent ? (
            <form onSubmit={handleRequestOtp} className="space-y-4">
              <div>
                <label htmlFor="owner-phone" className="block text-sm font-medium mb-1">
                  {t('auth.mobileNumberLabel', 'Mobile Number')}
                </label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 border border-r-0 border-divider bg-gray-50 text-secondary text-sm">
                    +91
                  </span>
                  <input
                    id="owner-phone"
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel-national"
                    maxLength={10}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                    placeholder="9876543210"
                    className="input-field flex-1"
                    required
                  />
                </div>
                <p className="text-xs text-secondary mt-1">
                  {t('auth.otpNote', 'We will send a 6-digit verification code via simulated SMS.')}
                </p>
              </div>

              <button
                type="submit"
                disabled={loading || phone.length < 10}
                className={`w-full mt-2 py-3 px-6 rounded font-semibold text-sm transition-all min-h-touch ${
                  phone.length === 10 && !loading
                    ? 'bg-airtel-red text-white hover:bg-dark-red shadow-sm cursor-pointer'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                {loading ? t('common.sending', 'Sending...') : t('auth.getOtp', 'Get OTP')}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-6">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label htmlFor="otp-0" className="block text-sm font-medium">
                    {t('auth.enterOtpLabel', 'Enter 6-digit Code')}
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setOtpSent(false);
                      setOtp(['', '', '', '', '', '']);
                    }}
                    className="text-xs text-airtel-red hover:underline"
                  >
                    {t('auth.changeNumber', 'Change number')}
                  </button>
                </div>
                <p className="text-xs text-secondary mb-3">
                  Sent to +91 {phone.slice(0, 2)}••••••{phone.slice(-2)}
                </p>

                {/* 6-box OTP entry */}
                <div className="flex justify-between gap-2" onPaste={handleOtpPaste}>
                  {otp.map((digit, idx) => (
                    <input
                      key={idx}
                      id={`otp-${idx}`}
                      ref={(el) => (otpInputsRef.current[idx] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(idx, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                      aria-label={`Digit ${idx + 1}`}
                      className="w-12 h-14 text-center text-xl font-bold border border-divider rounded focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-secondary">
                  {countdown > 0 ? (
                    `Resend in ${countdown}s`
                  ) : (
                    <button
                      type="button"
                      onClick={handleRequestOtp}
                      className="text-airtel-red font-medium hover:underline"
                    >
                      {t('auth.resendOtp', 'Resend OTP')}
                    </button>
                  )}
                </span>

                {/* Dev Helper autofill */}
                {devOutboxCode && (
                  <button
                    type="button"
                    onClick={handleAutofillDevOtp}
                    className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-800 px-2 py-1 rounded"
                    title="Dev mode simulated OTP"
                  >
                    Autofill code ({devOutboxCode})
                  </button>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || otp.join('').length !== 6}
                className={`w-full py-3 px-6 rounded font-semibold text-sm transition-all min-h-touch ${
                  otp.join('').length === 6 && !loading
                    ? 'bg-airtel-red text-white hover:bg-dark-red shadow-sm cursor-pointer'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                {loading ? t('common.verifying', 'Verifying...') : t('auth.verifyContinue', 'Verify & Continue')}
              </button>
            </form>
          )}

          {/* Dev mode drawer banner */}
          <div className="p-3 bg-amber-50 border border-amber-200 rounded text-xs text-amber-900">
            <span className="font-semibold uppercase tracking-wider block mb-1">
              Simulated OTP Mode
            </span>
            Messages are routed to the simulated notifications outbox. You can also view recent codes at{' '}
            <a
              href="/api/v1/dev/outbox"
              target="_blank"
              rel="noreferrer"
              className="font-medium underline hover:text-amber-700"
            >
              /api/v1/dev/outbox
            </a>
            .
          </div>
        </div>
      )}

      {/* Staff Login Form */}
      {activeTab === 'staff' && (
        <form onSubmit={handleStaffLoginSubmit} className="space-y-4">
          <div>
            <label htmlFor="staff-email" className="block text-sm font-medium mb-1">
              {t('auth.staffEmailLabel', 'Official Email Address')}
            </label>
            <input
              id="staff-email"
              type="email"
              autoComplete="email"
              value={staffEmail}
              onChange={(e) => setStaffEmail(e.target.value)}
              placeholder="admin@airtel.com"
              className="input-field"
              required
            />
          </div>

          <div>
            <label htmlFor="staff-password" className="block text-sm font-medium mb-1">
              {t('auth.staffPasswordLabel', 'Password')}
            </label>
            <input
              id="staff-password"
              type="password"
              autoComplete="current-password"
              value={staffPassword}
              onChange={(e) => setStaffPassword(e.target.value)}
              placeholder="••••••••••••"
              className="input-field"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading || !staffEmail || !staffPassword}
            className={`w-full mt-2 py-3 px-6 rounded font-semibold text-sm transition-all min-h-touch ${
              staffEmail && staffPassword && !loading
                ? 'bg-airtel-red text-white hover:bg-dark-red shadow-sm cursor-pointer'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {loading ? t('common.loggingIn', 'Signing In...') : t('auth.staffSignIn', 'Sign In as Staff')}
          </button>

          {/* Seed demo credentials helper */}
          <div className="mt-4 p-3 bg-gray-50 border border-divider rounded text-xs space-y-1">
            <p className="font-medium text-primary">Demo Staff Credentials:</p>
            <p className="text-secondary">
              Admin: <code className="bg-gray-200 px-1 py-0.5 rounded">admin@airtel.com</code> /{' '}
              <code className="bg-gray-200 px-1 py-0.5 rounded">DemoPassword123!</code>
            </p>
            <p className="text-secondary">
              Advisor: <code className="bg-gray-200 px-1 py-0.5 rounded">advisor@airtel.com</code>
            </p>
            <p className="text-secondary">
              Partner: <code className="bg-gray-200 px-1 py-0.5 rounded">partner@airtel.com</code>
            </p>
          </div>
        </form>
      )}
      </main>
      <Footer />
    </div>
  );
}
