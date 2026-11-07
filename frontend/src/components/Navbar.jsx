import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../store/authStore.js';
import { useState } from 'react';
import { switchLanguage, getCurrentLanguage } from '../i18n/index.js';

export default function Navbar() {
  const { i18n, t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [menuOpen, setMenuOpen] = useState(false);

  const currentLang = getCurrentLanguage();
  const toggleLang = () => {
    switchLanguage();
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navLinks = [
    { to: '/home', label: t('nav.home', 'My Udyam') },
    { to: '/advisor', label: t('nav.advisor', 'Advisor') },
    { to: '/quotes', label: t('nav.quotes', 'Quote') },
    { to: '/kyc', label: t('nav.kyc', 'Smart KYC') },
    { to: '/tracker', label: t('nav.tracker', 'Track Order') },
    { to: '/help', label: t('nav.help', 'Help & FAQ') },
  ];

  if (user?.role === 'advisor' || user?.role === 'compliance_officer' || user?.role === 'admin') {
    navLinks.push({ to: '/backoffice', label: t('nav.backoffice', 'Back-Office') });
  }

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <span className="w-8 h-8 rounded-lg bg-airtel-red flex items-center justify-center text-white font-black text-xl shadow-xs">
              a
            </span>
            <div className="flex flex-col">
              <span className="font-bold text-slate-900 tracking-tight text-base leading-tight">
                airtel <span className="font-normal text-slate-500">business</span>
              </span>
              <span className="text-xs font-semibold text-airtel-red uppercase tracking-wider">
                Udyam One
              </span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1" aria-label="Main Navigation">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.to;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-red-50 text-airtel-red font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Right Controls */}
          <div className="flex items-center gap-3">
            {/* Language Toggle */}
            <button
              type="button"
              onClick={toggleLang}
              className="px-2.5 py-1 text-xs font-semibold rounded-full border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors"
              aria-label="Switch Language"
            >
              {currentLang === 'hi' ? 'English' : 'हिंदी'}
            </button>

            {/* Auth CTA */}
            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                <Link
                  to="/account/privacy"
                  className="hidden sm:inline-flex items-center px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200"
                  title="DPDP Privacy Centre"
                >
                  🛡️ DPDP Privacy
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="px-3 py-1.5 text-xs font-medium text-slate-700 border border-slate-300 rounded-md hover:bg-slate-100"
                >
                  {t('nav.logout', 'Sign Out')}
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="px-4 py-1.5 text-xs font-semibold text-white bg-airtel-red hover:bg-red-700 rounded-md shadow-xs transition-colors"
              >
                {t('nav.login', 'Log In')}
              </Link>
            )}

            {/* Mobile Hamburger */}
            <button
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden p-2 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-hidden"
              aria-expanded={menuOpen}
              aria-label="Toggle Navigation Menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {menuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile dropdown menu */}
        {menuOpen && (
          <div className="md:hidden py-3 border-t border-slate-200 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMenuOpen(false)}
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  location.pathname === link.to
                    ? 'bg-red-50 text-airtel-red font-semibold'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                {link.label}
              </Link>
            ))}
            <Link
              to="/account/privacy"
              onClick={() => setMenuOpen(false)}
              className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:bg-slate-100"
            >
              🛡️ {t('nav.privacyCentre', 'DPDP Privacy Centre')}
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
