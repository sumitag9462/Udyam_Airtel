import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';

export default function Landing() {
  const { t, i18n } = useTranslation();
  const isHi = i18n.language === 'hi';

  const steps = [
    {
      num: '01',
      title: isHi ? 'बिजनेस जरूरतें समझें' : 'AI Needs Discovery',
      desc: isHi
        ? 'हिंदी या इंग्लिश में AI एडवाइजर से बात करें। आपके स्टाफ साइज और लोकेशन के मुताबिक सही प्लान।'
        : 'Chat with our AI Advisor in Hindi or English. Get tailored recommendations in under 2 minutes.',
      icon: '💬',
    },
    {
      num: '02',
      title: isHi ? 'पारदर्शी मंथली कोट' : 'One Transparent Quote',
      desc: isHi
        ? 'कैटलॉग-सत्यापित एक निश्चित मासिक मूल्य। कोई छिपा हुआ चार्ज नहीं, ऐड-ऑन अपनी मर्जी से जोड़ें।'
        : 'Deterministic, rule-verified pricing. One single monthly invoice with add-on toggles you control.',
      icon: '📋',
    },
    {
      num: '03',
      title: isHi ? 'स्मार्ट पेपरलेस KYC' : 'Smart Paperless KYC',
      desc: isHi
        ? 'DPDP-सम्मत सहमति, ऑटोमेटेड GSTIN/उद्यम चेक्स और त्वरित दस्तावेज़ सत्यापन।'
        : 'Consent-first DPDP verification with instant GSTIN/Udyam registry lookup and OCR checks.',
      icon: '🛡️',
    },
    {
      num: '04',
      title: isHi ? 'ऑर्डर ट्रैकर' : 'Live Order Tracker',
      desc: isHi
        ? 'बिना कॉल किए फाइबर इंस्टॉलेशन और एक्टिवेशन की रीयल-टाइम स्थिति देखें।'
        : 'Track optical feasibility, slot booking, and technician milestones without calling support.',
      icon: '🚀',
    },
  ];

  const highlights = [
    { title: '100% Rule-Verified', subtitle: 'No hallucinated prices. Every rupee backed by official catalogue.' },
    { title: 'DPDP Act 2023 Compliant', subtitle: 'Purpose limitation, consent receipts, and one-click data withdrawal.' },
    { title: 'Deterministic SLA', subtitle: 'Live optical milestone tracking directly to your doorstep.' },
  ];

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-gray-50 to-white border-b border-divider py-16 sm:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 border border-red-200 text-airtel-red text-xs font-semibold uppercase tracking-wider mb-6">
            <span className="w-2 h-2 rounded-full bg-airtel-red animate-pulse" />
            Airtel SYNC 2026 · Project Udyam Digital
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-primary max-w-4xl mx-auto leading-tight">
            Smart Business Connectivity <br className="hidden sm:inline" />
            <span className="text-airtel-red">Engineered for Indian SMBs</span>
          </h1>

          <p className="mt-4 text-base sm:text-lg text-secondary max-w-2xl mx-auto leading-relaxed">
            {isHi
              ? 'बिना किसी परेशानी के अपने व्यापार के लिए हाई-स्पीड फाइबर, क्लाउड टूल्स और स्मार्ट सिक्योरिटी प्राप्त करें। पारदर्शी कीमत, पेपरलेस KYC और लाइव डिलीवरी ट्रैकिंग।'
              : 'Empowering India’s 63M micro and small enterprises with transparent pricing, instant AI-guided configuration, paperless Smart KYC, and live delivery tracking.'}
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              to="/advisor"
              className="w-full sm:w-auto px-8 py-3.5 bg-airtel-red hover:bg-dark-red text-white font-semibold rounded-lg shadow-sm transition-all text-sm text-center"
            >
              {isHi ? 'AI एडवाइजर से बात करें →' : 'Chat with AI Advisor →'}
            </Link>
            <Link
              to="/quotes"
              className="w-full sm:w-auto px-8 py-3.5 bg-white border border-divider hover:border-gray-400 text-primary font-semibold rounded-lg transition-all text-sm text-center"
            >
              {isHi ? 'प्लान और कोट्स देखें' : 'Explore Plans & Quotes'}
            </Link>
          </div>

          <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6 pt-10 border-t border-divider max-w-3xl mx-auto text-left">
            {highlights.map((h, i) => (
              <div key={i} className="flex flex-col">
                <span className="text-xs font-bold text-primary">{h.title}</span>
                <span className="text-xs text-secondary mt-1">{h.subtitle}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4-Step How It Works */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-primary">
              {isHi ? '4 आसान चरणों में एक्टिवेशन' : 'How Udyam One Works'}
            </h2>
            <p className="text-sm text-secondary mt-2">
              {isHi
                ? 'पारंपरिक 3-हफ्ते की जटिल प्रक्रिया को बदलकर सिर्फ कुछ मिनटों में पूरा करें।'
                : 'From initial requirements to fiber activation in four clear, transparent steps.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {steps.map((step) => (
              <div
                key={step.num}
                className="bg-gray-50 border border-divider rounded-xl p-6 flex flex-col justify-between hover:shadow-sm transition-shadow relative"
              >
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-2xl" aria-hidden="true">
                      {step.icon}
                    </span>
                    <span className="text-xs font-extrabold text-airtel-red bg-red-50 border border-red-100 px-2.5 py-0.5 rounded-full">
                      Step {step.num}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-primary mb-2">{step.title}</h3>
                  <p className="text-xs text-secondary leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Link
              to="/advisor"
              className="inline-flex items-center gap-2 text-sm font-bold text-airtel-red hover:underline"
            >
              {isHi ? 'अभी अपनी जरूरतें बताएं और प्लान चुनें →' : 'Start your business assessment now →'}
            </Link>
          </div>
        </div>
      </section>

      {/* Trust & DPDP Privacy Banner */}
      <section className="py-12 bg-gray-50 border-t border-divider">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="max-w-xl">
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              DPDP Act 2023 Compliant
            </span>
            <h3 className="text-lg font-bold text-primary mt-2">
              {isHi ? 'आपकी प्राइवेसी और डेटा सुरक्षा हमारी प्राथमिकता है' : 'Your Business Privacy & Consent Are Protected'}
            </h3>
            <p className="text-xs text-secondary mt-1">
              {isHi
                ? 'हम केवल आपके द्वारा दी गई सहमति के आधार पर ही डेटा का उपयोग करते हैं। आप किसी भी समय अपनी सहमति वापस ले सकते हैं।'
                : 'Udyam One enforces purpose limitation and data minimisation. Download consent receipts and manage data rights at any time in the Privacy Centre.'}
            </p>
          </div>

          <div className="flex gap-3">
            <Link
              to="/account/privacy"
              className="px-4 py-2 bg-white border border-divider hover:border-gray-400 text-xs font-semibold rounded text-primary transition-colors whitespace-nowrap"
            >
              Privacy Centre →
            </Link>
            <Link
              to="/how-it-works"
              className="px-4 py-2 bg-white border border-divider hover:border-gray-400 text-xs font-semibold rounded text-primary transition-colors whitespace-nowrap"
            >
              How It Works
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
