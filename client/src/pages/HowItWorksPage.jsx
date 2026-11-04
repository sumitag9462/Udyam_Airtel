import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';

export default function HowItWorksPage() {
  const steps = [
    {
      num: '01',
      title: 'Conversational AI Advisor',
      tag: 'Fixes 65% pre-assessment drop-off',
      description:
        'Chat naturally in Hindi or English. The advisor gathers your business type, site requirements, and employee count in 6 questions or fewer, recommending tailored connectivity without intimidating telecom jargon.',
      features: [
        'Bilingual Natural Language understanding (Hindi/English)',
        'Zero numerical hallucinations — rules engine calculates all facts',
        'Automatic segment mapping (Micro, Professional, Multi-site, Manufacturing)',
      ],
      link: '/advisor',
      cta: 'Try AI Advisor',
    },
    {
      num: '02',
      title: 'Transparent Instant Quote',
      tag: 'Plugs 1,113 quote drop-outs',
      description:
        'Get one transparent monthly total computed directly from Airtel’s official catalogue. Toggle add-ons like Static IP and Secure Wi-Fi, explore Business Preview scenarios, and lock your rate with zero drift guaranteed.',
      features: [
        'Deterministic pricing engine directly from product catalogue',
        'Business Preview mode tests cashiers, remote staff, and POS loads',
        'Price-lock guarantee upon quote acceptance',
      ],
      link: '/quotes',
      cta: 'Explore Quotes',
    },
    {
      num: '03',
      title: 'Smart Paperless KYC',
      tag: 'Eliminates 273 paperwork failures',
      description:
        'Complete regulatory verification in minutes without physical branch visits. Explicit DPDP Act 2023 consent, automated OCR extraction, and 19 regulatory checks with honest human fallback.',
      features: [
        'AES-256-GCM encrypted document vault at rest',
        'Automated GSTIN/Udyam registry matching with Jaro-Winkler fuzzy tolerance',
        'Honest routing: clean cases auto-verified, uncertain cases to human review',
      ],
      link: '/kyc',
      cta: 'Start Smart KYC',
    },
    {
      num: '04',
      title: 'Live Telemetry Tracker',
      tag: 'Solves installation delay churn',
      description:
        'Never wonder when your fiber line will go live. Track 5 sequential stages from feasibility to optical activation, book a 2-hour technician slot, and request proactive support with one click.',
      features: [
        'End-to-end delivery stepper with realistic estimated activation dates',
        'Interactive slot booking across 3 time windows per day',
        'Simulated optical signal telemetry and one-tap technician callback',
      ],
      link: '/tracker',
      cta: 'Track Delivery',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="grow max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold text-airtel-red uppercase tracking-wider">
            Architecture & Process
          </span>
          <h1 className="text-4xl font-extrabold text-slate-900 mt-2 mb-4">
            How Udyam One Transforms SMB Onboarding
          </h1>
          <p className="text-slate-600 text-base leading-relaxed">
            From first inquiry to live optical telemetry, every stage is designed to eliminate the historical leaks where 92.64% of SMB leads were lost.
          </p>
        </div>

        {/* Steps list */}
        <div className="space-y-12">
          {steps.map((s, idx) => (
            <div
              key={idx}
              className="bg-white rounded-3xl border border-slate-200 p-8 shadow-xs flex flex-col md:flex-row gap-8 items-start"
            >
              <div className="shrink-0 flex items-center justify-center w-16 h-16 rounded-2xl bg-red-50 text-airtel-red font-black text-2xl border border-red-100">
                {s.num}
              </div>

              <div className="grow space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-2xl font-bold text-slate-900">{s.title}</h2>
                  <span className="px-3 py-1 text-xs font-bold rounded-full bg-red-50 text-airtel-red border border-red-200">
                    {s.tag}
                  </span>
                </div>

                <p className="text-slate-600 text-sm leading-relaxed">{s.description}</p>

                <ul className="space-y-2 pt-2">
                  {s.features.map((feat, fIdx) => (
                    <li key={fIdx} className="flex items-center gap-2 text-xs font-medium text-slate-700">
                      <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px] font-bold">
                        ✓
                      </span>
                      {feat}
                    </li>
                  ))}
                </ul>

                <div className="pt-4">
                  <Link
                    to={s.link}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors"
                  >
                    {s.cta} →
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Closing summary banner */}
        <div className="mt-16 bg-slate-900 text-white rounded-3xl p-8 sm:p-10 text-center">
          <h3 className="text-2xl font-bold mb-3">Ready to transform your enterprise connectivity?</h3>
          <p className="text-slate-400 text-sm max-w-xl mx-auto mb-6">
            Explore your business connectivity pack in under 3 minutes with zero commitment and full DPDP Act 2023 compliance.
          </p>
          <Link
            to="/advisor"
            className="inline-block px-6 py-3 bg-airtel-red hover:bg-red-700 text-white font-bold text-sm rounded-xl shadow-lg transition-colors"
          >
            Start with AI Advisor
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
