import { useState } from 'react';
import { previewQuoteScenario } from './api.js';

export default function BusinessPreview({ quoteId, quote, profile }) {
  const [activeScenario, setActiveScenario] = useState(null);
  const [scenarioData, setScenarioData] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const scenarios = [
    {
      id: 'link_failure',
      title: 'Fibre Cut Resilience',
      subtitle: 'What happens during an unexpected physical line disruption?',
      icon: '⚡',
    },
    {
      id: 'budget_cut',
      title: '20% Budget Cut',
      subtitle: 'How can you reduce expenditure while keeping core services intact?',
      icon: '📉',
    },
    {
      id: 'second_site',
      title: 'Multi-Site Expansion',
      subtitle: 'How do service and setup costs scale when opening a second branch?',
      icon: '🏢',
    },
  ];

  const handleRunScenario = async (scenarioId) => {
    setActiveScenario(scenarioId);
    setError(null);
    if (!scenarioData[scenarioId]) {
      try {
        setLoading(true);
        const res = await previewQuoteScenario(quoteId, scenarioId, {
          lineItems: quote?.lineItems,
          profile: profile || quote?.profileSnapshot,
        });
        setScenarioData((prev) => ({ ...prev, [scenarioId]: res.preview }));
      } catch (err) {
        setError(err.message || 'Failed to simulate scenario.');
      } finally {
        setLoading(false);
      }
    }
  };

  const preview = activeScenario ? scenarioData[activeScenario] : null;

  return (
    <div className="bg-white border border-divider rounded-lg p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-primary">Business Continuity & Scenario Preview</h2>
            <span className="text-[11px] uppercase tracking-wider font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded">
              Simulated Preview
            </span>
          </div>
          <p className="text-xs text-secondary mt-1">
            Test how your plan responds to real-world business events. All calculations are rules-driven.
          </p>
        </div>
      </div>

      {/* Scenario Selector Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {scenarios.map((sc) => {
          const isSelected = activeScenario === sc.id;
          return (
            <button
              key={sc.id}
              type="button"
              onClick={() => handleRunScenario(sc.id)}
              className={`text-left p-3.5 rounded-lg border-2 transition-all flex flex-col justify-between ${
                isSelected
                  ? 'border-airtel-red bg-red-50/20 shadow-sm'
                  : 'border-divider hover:border-gray-400 bg-white'
              }`}
            >
              <div>
                <span className="text-xl mb-1 block" aria-hidden="true">{sc.icon}</span>
                <span className="font-bold text-sm text-primary block">{sc.title}</span>
                <span className="text-xs text-secondary mt-1 block">{sc.subtitle}</span>
              </div>
              <span className={`text-[11px] font-semibold mt-3 ${isSelected ? 'text-airtel-red' : 'text-secondary'}`}>
                {isSelected ? '✓ Viewing Result' : 'Simulate →'}
              </span>
            </button>
          );
        })}
      </div>

      {/* Scenario Output Panel */}
      {activeScenario && (
        <div className="p-5 bg-gray-50 border border-divider rounded-lg space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-divider">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-primary">Simulation Result:</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-white border border-divider">
                {scenarios.find((s) => s.id === activeScenario)?.title}
              </span>
            </div>
            <span className="text-[11px] text-secondary font-medium">
              Rules Engine Evaluation
            </span>
          </div>

          {loading ? (
            <p className="text-xs text-secondary py-4 text-center">Simulating rule impact...</p>
          ) : error ? (
            <p className="text-xs text-dark-red py-2">{error}</p>
          ) : preview ? (
            <div className="space-y-4 text-xs">
              {/* Fibre Cut Scenario */}
              {activeScenario === 'link_failure' && (
                <div className="space-y-3">
                  <div
                    className={`p-3 rounded border font-medium ${
                      preview.hasProtection
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                        : 'bg-amber-50 border-amber-200 text-amber-900'
                    }`}
                  >
                    <p className="font-bold mb-1">
                      {preview.hasProtection ? '✓ Automatic Cellular Failover Configured' : '⚠️ Single Point of Failure'}
                    </p>
                    <p>{preview.summary}</p>
                  </div>
                </div>
              )}

              {/* Budget Cut Scenario */}
              {activeScenario === 'budget_cut' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 bg-white border border-divider rounded">
                    <div>
                      <span className="text-secondary block">Current Monthly:</span>
                      <span className="text-base font-bold text-primary">
                        ₹{preview.originalMonthly?.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div>
                      <span className="text-secondary block">Optimized Monthly:</span>
                      <span className="text-base font-bold text-emerald-700">
                        ₹{preview.newMonthly?.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div>
                      <span className="text-secondary block">Monthly Reduction:</span>
                      <span className="text-base font-bold text-airtel-red">
                        -₹{preview.deltaMonthly?.toLocaleString('en-IN')} / mo
                      </span>
                    </div>
                  </div>

                  {preview.givenUpItems?.length > 0 && (
                    <div>
                      <span className="font-semibold text-secondary block mb-1">
                        Recommended trade-offs to meet budget:
                      </span>
                      <ul className="list-disc pl-4 space-y-1 text-primary">
                        {preview.givenUpItems.map((g, i) => (
                          <li key={i}>
                            Remove <strong>{g.name}</strong> (save ₹{g.monthlySaving?.toLocaleString('en-IN')}/mo)
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Second Site Scenario */}
              {activeScenario === 'second_site' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-white border border-divider rounded">
                    <div>
                      <span className="text-secondary block">Sites:</span>
                      <span className="text-base font-bold text-primary">
                        {preview.originalSites} → {preview.newSites} Sites
                      </span>
                    </div>
                    <div>
                      <span className="text-secondary block">New Monthly:</span>
                      <span className="text-base font-bold text-primary">
                        ₹{preview.newMonthly?.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div>
                      <span className="text-secondary block">New Setup:</span>
                      <span className="text-base font-bold text-primary">
                        ₹{preview.newSetup?.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div>
                      <span className="text-secondary block">Monthly Delta:</span>
                      <span className="text-base font-bold text-airtel-red">
                        +₹{(preview.newMonthly - preview.originalMonthly)?.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Non-negotiable honest disclaimer banner */}
              <div className="pt-2 text-[11px] text-secondary italic border-t border-divider flex items-center gap-1.5">
                <span aria-hidden="true">ℹ️</span>
                <span>
                  <strong>Honest Notice:</strong> {preview.disclaimer || 'Simulation based on rules engine. No uptime or activation speed guarantees.'}
                </span>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
