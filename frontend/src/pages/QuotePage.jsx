import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../store/authStore.js';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';
import TierCards from '../features/quotes/TierCards.jsx';
import QuoteConfigurator from '../features/quotes/QuoteConfigurator.jsx';
import BusinessPreview from '../features/quotes/BusinessPreview.jsx';
import QuoteAcceptModal from '../features/quotes/QuoteAcceptModal.jsx';
import {
  fetchBundles,
  fetchCatalogue,
  createQuote,
  getQuote,
  updateQuoteItems,
  computeQuotePreview,
} from '../features/quotes/api.js';

export default function QuotePage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuthStore();

  const [catalogue, setCatalogue] = useState([]);
  const [tiers, setTiers] = useState([]);
  const [activeTier, setActiveTier] = useState('standard');
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState(null);
  const [isAcceptModalOpen, setIsAcceptModalOpen] = useState(false);

  // Default profile if none stored in session
  const defaultProfile = {
    businessName: 'Law Firm & Associates',
    businessType: 'CA / Law office',
    segment: 'prof',
    employeeCount: 14,
    numSites: 1,
    city: 'Delhi',
    cityTier: 1,
    hasGstin: true,
    mustHaves: ['email', 'cloud_backup'],
    budgetMonthly: 5000,
  };

  const getActiveProfile = () => {
    if (location.state?.profile && location.state.profile.businessType) {
      return location.state.profile;
    }
    try {
      const saved = JSON.parse(sessionStorage.getItem('udyam_advisor_profile') || 'null');
      if (saved && (saved.businessType || saved.city)) return saved;
    } catch {
      // ignore
    }
    return defaultProfile;
  };

  const currentProfile = getActiveProfile();

  // Initial data loading
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        setLoading(true);
        setError(null);

        // 1. Fetch catalogue
        const catRes = await fetchCatalogue();
        if (isMounted) setCatalogue(catRes.products || []);

        // 2. If quote ID provided in URL, load specific quote
        if (id) {
          const qRes = await getQuote(id);
          if (isMounted) {
            setQuote(qRes.quote);
            setActiveTier(qRes.quote.tierLabel);
          }
        } else {
          // Check if there is already an accepted locked quote in session
          const acceptedQuoteId = typeof window !== 'undefined' && window.sessionStorage ? sessionStorage.getItem('udyam_accepted_quote_id') : null;
          if (acceptedQuoteId && isAuthenticated) {
            try {
              const qRes = await getQuote(acceptedQuoteId);
              if (qRes?.quote && qRes.quote.status === 'accepted') {
                if (isMounted) {
                  setQuote(qRes.quote);
                  setActiveTier(qRes.quote.tierLabel);
                  // also fetch bundles in background for tier cards display
                  fetchBundles(currentProfile).then((res) => {
                    if (isMounted) setTiers(res.tiers || []);
                  }).catch(() => {});
                  setLoading(false);
                  return;
                }
              }
            } catch {
              // fallback to regular draft creation
            }
          }

          // 3. Otherwise compute 3 tiers for profile
          const preferredTier = location.state?.tier || sessionStorage.getItem('udyam_selected_tier') || 'standard';
          if (isMounted) setActiveTier(preferredTier);

          const bundlesRes = await fetchBundles(currentProfile);
          if (isMounted) {
            const returnedTiers = bundlesRes.tiers || [];
            setTiers(returnedTiers);

            // Create initial draft quote with recommended Standard tier
            if (isAuthenticated) {
              const pendingAccept = sessionStorage.getItem('udyam_pending_quote_accept');
              let customLineItems = null;
              if (pendingAccept) {
                try {
                  const parsed = JSON.parse(pendingAccept);
                  if (parsed.lineItems) customLineItems = parsed.lineItems;
                } catch {
                  // ignore
                }
              }
              const draftRes = await createQuote({
                tierLabel: preferredTier,
                profile: currentProfile,
              });
              if (customLineItems && draftRes.quote) {
                try {
                  const updatedRes = await updateQuoteItems(draftRes.quote.quoteId, customLineItems);
                  setQuote(updatedRes.quote);
                } catch {
                  setQuote(draftRes.quote);
                }
                sessionStorage.removeItem('udyam_pending_quote_accept');
                setIsAcceptModalOpen(true);
              } else {
                setQuote(draftRes.quote);
              }
            } else {
              // Local preview quote so guests can inspect line items
              const selectedTierData = returnedTiers.find((t) => t.tierLabel === preferredTier) || returnedTiers[0];
              if (selectedTierData) {
                setQuote({
                  quoteId: 'DRAFT-PREVIEW',
                  tierLabel: selectedTierData.tierLabel,
                  monthlyTotal: selectedTierData.monthlyTotal,
                  setupTotal: selectedTierData.setupTotal,
                  contractMonths: selectedTierData.contractMonths,
                  firstYearTotal: selectedTierData.firstYearTotal,
                  lineItems: selectedTierData.lineItems,
                  status: 'draft',
                  profileSnapshot: currentProfile,
                });
              }
            }
          }
        }
      } catch (err) {
        if (isMounted) setError(err.message || 'Failed to load plan details.');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, [id, isAuthenticated]);

  // Select a different tier
  const handleSelectTier = async (tierLabel) => {
    try {
      if (isImmutable) {
        const confirmChange = window.confirm(
          'Your current quote pricing is locked. Modifying plans will create a new draft quote revision. Do you want to proceed?'
        );
        if (!confirmChange) return;
        sessionStorage.removeItem('udyam_accepted_quote_id');
      }

      setUpdating(true);
      setError(null);
      setActiveTier(tierLabel);
      sessionStorage.setItem('udyam_selected_tier', tierLabel);

      if (isAuthenticated) {
        const draftRes = await createQuote({
          tierLabel,
          profile: quote?.profileSnapshot || currentProfile,
        });
        setQuote(draftRes.quote);
      } else {
        const selectedTierData = tiers.find((t) => t.tierLabel === tierLabel);
        if (selectedTierData) {
          setQuote({
            quoteId: 'DRAFT-PREVIEW',
            tierLabel: selectedTierData.tierLabel,
            monthlyTotal: selectedTierData.monthlyTotal,
            setupTotal: selectedTierData.setupTotal,
            contractMonths: selectedTierData.contractMonths,
            firstYearTotal: selectedTierData.firstYearTotal,
            lineItems: selectedTierData.lineItems,
            status: 'draft',
            profileSnapshot: currentProfile,
          });
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to apply tier.');
    } finally {
      setUpdating(false);
    }
  };

  const handleStartNewRevision = async () => {
    sessionStorage.removeItem('udyam_accepted_quote_id');
    try {
      setUpdating(true);
      setError(null);
      const draftRes = await createQuote({
        tierLabel: activeTier || 'standard',
        profile: quote?.profileSnapshot || currentProfile,
      });
      setQuote(draftRes.quote);
    } catch (err) {
      setError(err.message || 'Failed to create new revision.');
    } finally {
      setUpdating(false);
    }
  };

  // Update line items in quote
  const handleUpdateItems = async (newLineItems) => {
    if (!quote) return;
    if (!isAuthenticated || quote.quoteId === 'DRAFT-PREVIEW') {
      try {
        setUpdating(true);
        setError(null);
        const res = await computeQuotePreview(newLineItems);
        const updated = {
          ...quote,
          monthlyTotal: res.monthlyTotal,
          setupTotal: res.setupTotal,
          contractMonths: res.contractMonths,
          firstYearTotal: res.firstYearTotal,
          lineItems: res.lineItems,
          profileSnapshot: currentProfile,
        };
        setQuote(updated);
        sessionStorage.setItem('udyam_guest_quote', JSON.stringify(updated));
      } catch (err) {
        setError(err.message || 'Failed to update plan items.');
      } finally {
        setUpdating(false);
      }
      return;
    }
    try {
      setUpdating(true);
      setError(null);
      const res = await updateQuoteItems(quote.quoteId, newLineItems);
      setQuote(res.quote);
    } catch (err) {
      setError(err.message || 'Failed to update plan items.');
    } finally {
      setUpdating(false);
    }
  };

  const handleAcceptClick = () => {
    if (!isAuthenticated) {
      sessionStorage.setItem(
        'udyam_pending_quote_accept',
        JSON.stringify({
          tier: activeTier,
          lineItems: quote?.lineItems,
          profile: currentProfile,
        })
      );
      navigate('/login', {
        state: { from: `/quotes${id ? `/${id}` : ''}`, profile: currentProfile, tier: activeTier },
      });
      return;
    }
    setIsAcceptModalOpen(true);
  };

  const handleExploreDefault = async () => {
    try {
      setLoading(true);
      const bundlesRes = await fetchBundles(defaultProfile);
      setTiers(bundlesRes.tiers || []);
      setActiveTier('standard');
    } catch (err) {
      setError(err.message || 'Failed to calculate standard plans.');
    } finally {
      setLoading(false);
    }
  };

  const isImmutable = quote?.status === 'accepted';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      {/* Main Workspace */}
      <main className="container-admin py-8 space-y-8 flex-1">
        {/* Header Breadcrumbs / Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-primary">{t('quotes.pageTitle', 'Transparent Business Quote')}</h1>
            <p className="text-xs text-secondary mt-1">
              {t('quotes.subtitle', 'Deterministic, rule-verified pricing. One single predictable monthly cost with zero hidden surcharges.')}
            </p>
          </div>

          {quote && (
            <div className="flex items-center gap-3 self-start sm:self-auto">
              <div className="text-right">
                <span className="text-xs text-secondary block">{t('quotes.monthlyTotal', 'Monthly Total')}:</span>
                <span className="text-xl font-extrabold text-primary">
                  ₹{quote.monthlyTotal.toLocaleString('en-IN')}/mo
                </span>
              </div>
              {!isImmutable ? (
                <button
                  type="button"
                  onClick={handleAcceptClick}
                  className="btn-primary text-xs py-2.5 px-4 font-semibold"
                >
                  {isAuthenticated ? t('quotes.acceptAndLock', 'Accept Quote & Lock Price →') : t('quotes.signInToAccept', 'Sign In to Accept Quote →')}
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-1.5">
                    <span>🔒</span>
                    <span>{t('quotes.pricingLocked', 'Pricing Locked')}</span>
                  </span>
                  <Link
                    to={`/kyc?quoteId=${quote.quoteId}&leadId=${quote.leadId || ''}`}
                    className="btn-primary text-xs py-2 px-3 font-semibold"
                  >
                    {t('quotes.proceedToKyc', 'Proceed to KYC →')}
                  </Link>
                  <button
                    type="button"
                    onClick={handleStartNewRevision}
                    className="btn-secondary text-xs py-2 px-2.5 font-semibold text-secondary hover:text-primary"
                    title="Start a new quote revision"
                  >
                    {t('quotes.newRevision', 'New Revision ⟳')}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {error && (
          <div
            role="alert"
            className="p-4 bg-red-50 border border-red-200 text-dark-red text-xs rounded-lg"
          >
            {error}
          </div>
        )}

        {loading ? (
          <div className="p-16 text-center text-secondary text-sm">
            Evaluating eligible Airtel Business bundles...
          </div>
        ) : (
          <>
            {/* Step 1: Recommended Tiers */}
            <section className="space-y-3" aria-labelledby="tiers-heading">
              <h2 id="tiers-heading" className="text-sm font-bold uppercase tracking-wider text-secondary">
                1. Choose Recommendation Tier
              </h2>
              <TierCards
                tiers={tiers}
                selectedTier={activeTier}
                onSelectTier={handleSelectTier}
                loading={updating}
                onExploreDefault={handleExploreDefault}
                budgetMonthly={currentProfile?.budgetMonthly}
              />
            </section>

            {/* Step 2: Quote Configurator */}
            {quote && (
              <section className="space-y-3" aria-labelledby="configurator-heading">
                <h2 id="configurator-heading" className="text-sm font-bold uppercase tracking-wider text-secondary">
                  2. Customize Add-ons & Quantities
                </h2>
                <QuoteConfigurator
                  quote={quote}
                  catalogue={catalogue}
                  onUpdateItems={handleUpdateItems}
                  onAcceptQuote={() => setIsAcceptModalOpen(true)}
                  isUpdating={updating}
                  isImmutable={isImmutable}
                />
              </section>
            )}

            {/* Step 3: Business Continuity Preview */}
            {quote && (
              <section className="space-y-3" aria-labelledby="preview-heading">
                <h2 id="preview-heading" className="text-sm font-bold uppercase tracking-wider text-secondary">
                  3. Business Scenario Preview
                </h2>
                <BusinessPreview quoteId={quote.quoteId} quote={quote} profile={currentProfile} />
              </section>
            )}
          </>
        )}
      </main>

      {/* Quote Acceptance Modal */}
      {quote && (
        <QuoteAcceptModal
          quote={quote}
          isOpen={isAcceptModalOpen}
          onClose={() => setIsAcceptModalOpen(false)}
          onAccepted={(acceptedQuote) => {
            setQuote(acceptedQuote);
            if (typeof window !== 'undefined' && window.sessionStorage) {
              sessionStorage.setItem('udyam_accepted_quote_id', acceptedQuote.quoteId);
            }
          }}
        />
      )}

      <Footer />
    </div>
  );
}
