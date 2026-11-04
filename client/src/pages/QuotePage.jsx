import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore.js';
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
} from '../features/quotes/api.js';

export default function QuotePage() {
  const { id } = useParams();
  const navigate = useNavigate();
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
    employeeCount: 5,
    numSites: 1,
    city: 'Delhi',
    cityTier: 1,
    hasGstin: true,
  };

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
          // 3. Otherwise compute 3 tiers for default profile
          const bundlesRes = await fetchBundles(defaultProfile);
          if (isMounted) {
            setTiers(bundlesRes.tiers || []);
            // Create initial draft quote with recommended Standard tier
            if (isAuthenticated) {
              const draftRes = await createQuote({
                tierLabel: 'standard',
                profile: defaultProfile,
              });
              setQuote(draftRes.quote);
              setActiveTier('standard');
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
      setUpdating(true);
      setError(null);
      setActiveTier(tierLabel);

      if (isAuthenticated) {
        const draftRes = await createQuote({
          tierLabel,
          profile: quote?.profileSnapshot || defaultProfile,
        });
        setQuote(draftRes.quote);
      }
    } catch (err) {
      setError(err.message || 'Failed to apply tier.');
    } finally {
      setUpdating(false);
    }
  };

  // Update line items in quote
  const handleUpdateItems = async (newLineItems) => {
    if (!quote) return;
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

  const isImmutable = quote?.status === 'accepted';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top Navigation */}
      <header className="bg-white border-b border-divider sticky top-0 z-40">
        <div className="container-admin h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <span className="font-extrabold text-lg text-primary">
              <span className="text-airtel-red">Airtel</span> Udyam One
            </span>
          </Link>

          <div className="flex items-center gap-4 text-xs">
            {isAuthenticated ? (
              <>
                <span className="text-secondary hidden sm:inline">
                  Signed in as <strong>{user?.phoneLast4 ? `••••${user.phoneLast4}` : user?.email}</strong> ({user?.role})
                </span>
                <button
                  type="button"
                  onClick={logout}
                  className="btn-secondary py-1.5 px-3 text-xs"
                >
                  Logout
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="btn-primary py-1.5 px-3 text-xs"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="container-admin py-8 space-y-8 flex-1">
        {/* Header Breadcrumbs / Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-primary">Transparent Business Quote</h1>
            <p className="text-xs text-secondary mt-1">
              Deterministic, rule-verified pricing. One single predictable monthly cost with zero hidden surcharges.
            </p>
          </div>

          {quote && (
            <div className="flex items-center gap-3 self-start sm:self-auto">
              <div className="text-right">
                <span className="text-xs text-secondary block">Monthly Total:</span>
                <span className="text-xl font-extrabold text-primary">
                  ₹{quote.monthlyTotal.toLocaleString('en-IN')}/mo
                </span>
              </div>
              {!isImmutable && (
                <button
                  type="button"
                  onClick={() => setIsAcceptModalOpen(true)}
                  className="btn-primary text-xs py-2.5 px-4 font-semibold"
                >
                  Accept Quote →
                </button>
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
                <BusinessPreview quoteId={quote.quoteId} />
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
          }}
        />
      )}
    </div>
  );
}
