import { Link } from 'react-router-dom';

export default function Footer() {

  return (
    <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Col */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-white font-bold text-lg">
              <span className="w-6 h-6 rounded-md bg-airtel-red flex items-center justify-center text-xs text-white">
                a
              </span>
              airtel business
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Udyam One · Project Udyam Digital (Track A).
              Empowering India’s 63M micro and small enterprises with transparent, enterprise-grade connectivity and paperless DPDP-compliant onboarding.
            </p>
          </div>

          {/* Product links */}
          <div>
            <h4 className="text-white font-semibold text-xs uppercase tracking-wider mb-3">Product</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/advisor" className="hover:text-white transition-colors">
                  AI Needs Advisor
                </Link>
              </li>
              <li>
                <Link to="/quotes" className="hover:text-white transition-colors">
                  Transparent Quote Builder
                </Link>
              </li>
              <li>
                <Link to="/kyc" className="hover:text-white transition-colors">
                  Smart Paperless KYC
                </Link>
              </li>
              <li>
                <Link to="/tracker" className="hover:text-white transition-colors">
                  Fiber Delivery Tracker
                </Link>
              </li>
            </ul>
          </div>

          {/* Privacy & Governance */}
          <div>
            <h4 className="text-white font-semibold text-xs uppercase tracking-wider mb-3">DPDP Act 2023</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/account/privacy" className="hover:text-white transition-colors">
                  Privacy Centre & Consent Control
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="hover:text-white transition-colors">
                  Notice & Purpose Limitation
                </Link>
              </li>
              <li>
                <Link to="/grievance" className="hover:text-white transition-colors">
                  File DPDP Grievance
                </Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-white transition-colors">
                  Service Terms & SLAs
                </Link>
              </li>
            </ul>
          </div>

          {/* Operations & Transparency */}
          <div>
            <h4 className="text-white font-semibold text-xs uppercase tracking-wider mb-3">Support & Audit</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/help" className="hover:text-white transition-colors">
                  Frequently Asked Questions
                </Link>
              </li>
              <li>
                <Link to="/how-it-works" className="hover:text-white transition-colors">
                  How Onboarding Works
                </Link>
              </li>
              <li>
                <Link to="/backoffice" className="hover:text-white transition-colors">
                  Back-Office & Funnel Analytics
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Regulatory disclaimer box */}
        <div className="pt-6 border-t border-slate-800 text-xs text-slate-500 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p>
              © 2026 Bharti Airtel Limited · Udyam One Prototype for Airtel SYNC Hackathon 2026.
            </p>
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] bg-slate-800 text-slate-300">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                AES-256-GCM Encrypted
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] bg-slate-800 text-amber-400">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                Telemetry & Registries Simulated
              </span>
            </div>
          </div>
          <p className="text-[11px] text-slate-500">
            Non-negotiable rule compliance: Rules engine owns all calculations; prices immutable upon quote acceptance; no raw PII logged; zero deceptive instant-KYC claims.
          </p>
        </div>
      </div>
    </footer>
  );
}
