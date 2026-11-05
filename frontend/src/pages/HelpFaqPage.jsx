import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { apiRequest } from '../api/client.js';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';

export default function HelpFaqPage() {
  const { i18n } = useTranslation();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState(null);
  const [expandedIndex, setExpandedIndex] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadFaq();
  }, [i18n.language]);

  const loadFaq = async () => {
    try {
      setLoading(true);
      const res = await apiRequest(`/faq?lang=${i18n.language}`);
      const cats = res.data?.categories || [];
      setCategories(cats);
      if (cats.length > 0) {
        setActiveCategory(cats[0].category);
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  const currentCat = categories.find((c) => c.category === activeCategory) || categories[0];

  const filteredItems = currentCat
    ? currentCat.items.filter(
        (item) =>
          item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.answer.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="grow max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-xs font-bold text-airtel-red uppercase tracking-wider">
            Help & Knowledge Base
          </span>
          <h1 className="text-3xl font-extrabold text-slate-900 mt-1 mb-3">
            {i18n.language === 'hi' ? 'अक्सर पूछे जाने वाले प्रश्न (FAQ)' : 'Frequently Asked Questions'}
          </h1>
          <p className="text-slate-600 text-sm">
            Everything you need to know about Airtel Udyam One connectivity, pricing transparency, and Smart KYC.
          </p>

          <div className="mt-6 relative max-w-md mx-auto">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search topics, GSTIN rules, delivery..."
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-slate-300 rounded-xl shadow-xs focus:ring-2 focus:ring-airtel-red focus:outline-hidden"
            />
            <span className="absolute left-3.5 top-3 text-slate-400">🔍</span>
          </div>
        </div>

        {loading ? (
          <div className="py-20 text-center">
            <div className="w-8 h-8 border-4 border-airtel-red border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-sm text-slate-500">Loading help center...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Category tabs */}
            <div className="space-y-1">
              {categories.map((cat) => (
                <button
                  key={cat.category}
                  type="button"
                  onClick={() => {
                    setActiveCategory(cat.category);
                    setExpandedIndex(null);
                  }}
                  className={`w-full text-left px-4 py-3 rounded-xl text-sm font-semibold transition-colors flex items-center justify-between ${
                    activeCategory === cat.category
                      ? 'bg-airtel-red text-white shadow-xs'
                      : 'text-slate-700 hover:bg-slate-200/60 bg-white'
                  }`}
                >
                  <span>{cat.categoryName}</span>
                  <span className="text-xs opacity-75">{cat.items.length}</span>
                </button>
              ))}

              <div className="pt-6">
                <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-xs text-red-900">
                  <p className="font-bold mb-1">Still need support?</p>
                  <p className="mb-3 text-red-700">Submit a formal inquiry or lodge a DPDP concern.</p>
                  <Link
                    to="/grievance"
                    className="inline-block px-3 py-1.5 bg-airtel-red text-white font-bold rounded-lg hover:bg-red-700"
                  >
                    File Grievance →
                  </Link>
                </div>
              </div>
            </div>

            {/* Questions accordion */}
            <div className="md:col-span-3 space-y-3">
              {filteredItems.length === 0 ? (
                <div className="bg-white rounded-2xl p-8 text-center border border-slate-200 text-slate-500 text-sm">
                  No matching questions found for &ldquo;{searchQuery}&rdquo;.
                </div>
              ) : (
                filteredItems.map((item, idx) => {
                  const isOpen = expandedIndex === idx;
                  return (
                    <div
                      key={idx}
                      className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden transition-colors"
                    >
                      <button
                        type="button"
                        onClick={() => setExpandedIndex(isOpen ? null : idx)}
                        className="w-full text-left p-4 sm:p-5 flex items-center justify-between gap-4 font-bold text-slate-900 hover:text-airtel-red transition-colors"
                        aria-expanded={isOpen}
                      >
                        <span className="text-base">{item.question}</span>
                        <span className="text-slate-400 font-normal text-xl shrink-0">
                          {isOpen ? '−' : '+'}
                        </span>
                      </button>
                      {isOpen && (
                        <div className="px-4 pb-5 sm:px-5 pt-0 text-sm text-slate-600 leading-relaxed border-t border-slate-50 mt-1">
                          {item.answer}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
