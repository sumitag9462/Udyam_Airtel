import { useState } from 'react';
import { explainProductRemoval } from './api.js';

export default function QuoteConfigurator({
  quote,
  catalogue,
  onUpdateItems,
  onAcceptQuote,
  isUpdating,
  isImmutable,
}) {
  const [expandedExplain, setExpandedExplain] = useState(null); // productId
  const [explainData, setExplainData] = useState({});
  const [explainLoading, setExplainLoading] = useState(false);
  const [showAddOns, setShowAddOns] = useState(false);

  // Load explanation for removal
  const handleToggleExplain = async (productId) => {
    if (expandedExplain === productId) {
      setExpandedExplain(null);
      return;
    }

    setExpandedExplain(productId);
    if (!explainData[productId]) {
      try {
        setExplainLoading(true);
        const res = await explainProductRemoval(quote.quoteId, productId);
        setExplainData((prev) => ({ ...prev, [productId]: res.explanation }));
      } catch (err) {
        console.error('Failed to load removal explanation', err);
      } finally {
        setExplainLoading(false);
      }
    }
  };

  // Quantity change
  const handleQtyChange = (productId, newQty) => {
    if (isImmutable || isUpdating) return;
    if (newQty < 1) {
      handleRemoveItem(productId);
      return;
    }
    const updated = quote.lineItems.map((item) =>
      item.productId === productId ? { productId, qty: newQty } : { productId: item.productId, qty: item.qty }
    );
    onUpdateItems(updated);
  };

  // Remove item
  const handleRemoveItem = (productId) => {
    if (isImmutable || isUpdating) return;
    const updated = quote.lineItems
      .filter((item) => item.productId !== productId)
      .map((item) => ({ productId: item.productId, qty: item.qty }));
    onUpdateItems(updated);
    if (expandedExplain === productId) {
      setExpandedExplain(null);
    }
  };

  // Add new product from catalogue
  const handleAddProduct = (productId) => {
    if (isImmutable || isUpdating) return;
    const current = quote.lineItems.map((item) => ({ productId: item.productId, qty: item.qty }));
    const exists = current.some((i) => i.productId === productId);
    if (!exists) {
      current.push({ productId, qty: 1 });
      onUpdateItems(current);
    }
  };

  const currentProductIds = new Set(quote.lineItems.map((i) => i.productId));
  const availableAddons = (catalogue || []).filter((p) => !currentProductIds.has(p.productId));

  return (
    <div className="bg-white border border-divider rounded-lg p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-divider">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-primary">Configured Solution Plan</h2>
            <span className="text-xs uppercase px-2 py-0.5 font-bold rounded bg-gray-100 text-secondary">
              ID: {quote.quoteId}
            </span>
            {isImmutable && (
              <span className="text-xs uppercase px-2 py-0.5 font-bold rounded bg-emerald-100 text-emerald-800">
                ✓ Locked & Accepted
              </span>
            )}
          </div>
          <p className="text-xs text-secondary mt-1">
            Toggle add-ons, adjust quantities, or inspect impact. Totals are computed live by the server rules engine.
          </p>
        </div>

        {!isImmutable && (
          <button
            type="button"
            onClick={() => setShowAddOns(!showAddOns)}
            className="btn-secondary text-xs py-2 px-3 self-start sm:self-auto"
          >
            {showAddOns ? 'Hide Add-on Catalogue' : '+ Browse Add-ons'}
          </button>
        )}
      </div>

      {/* Available Add-ons Shelf */}
      {showAddOns && !isImmutable && (
        <div className="p-4 bg-gray-50 border border-divider rounded-lg space-y-3">
          <h3 className="text-sm font-bold text-primary">Available Add-on Options</h3>
          <p className="text-xs text-secondary">
            Compatible capabilities based on your business segment. Select to attach to quote.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {availableAddons.map((addon) => (
              <div
                key={addon.productId}
                className="bg-white border border-divider p-3 rounded flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-bold text-primary">{addon.productName}</span>
                    <span className="text-[11px] font-semibold text-airtel-red">
                      ₹{addon.priceMinInrPerMonth}/{addon.unit.replace('per ', '')}
                    </span>
                  </div>
                  <p className="text-[11px] text-secondary mt-1 line-clamp-2">{addon.description}</p>
                </div>
                <button
                  type="button"
                  disabled={isUpdating}
                  onClick={() => handleAddProduct(addon.productId)}
                  className="mt-3 text-xs font-semibold text-airtel-red hover:underline self-end"
                >
                  + Add to quote
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Configured Line Items Table */}
      <div className="space-y-4">
        <ul className="divide-y divide-divider border-y border-divider">
          {quote.lineItems.map((item) => {
            const isExplaining = expandedExplain === item.productId;
            const explanation = explainData[item.productId];

            return (
              <li key={item.productId} className="py-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-primary">{item.name}</span>
                      <span className="text-[11px] text-secondary bg-gray-100 px-1.5 py-0.5 rounded">
                        {item.productId}
                      </span>
                    </div>
                    <div className="flex gap-4 mt-1 text-xs text-secondary">
                      <span>Rate: ₹{item.unitPrice.toLocaleString('en-IN')} / {item.unit}</span>
                      {item.setupFee > 0 && <span>Setup: ₹{item.setupFee.toLocaleString('en-IN')}</span>}
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-6">
                    {/* Quantity Stepper */}
                    {!isImmutable ? (
                      <div className="flex items-center border border-divider rounded">
                        <button
                          type="button"
                          aria-label={`Decrease quantity of ${item.name}`}
                          onClick={() => handleQtyChange(item.productId, item.qty - 1)}
                          disabled={isUpdating}
                          className="px-2.5 py-1 text-secondary hover:bg-gray-100 disabled:opacity-40"
                        >
                          -
                        </button>
                        <span className="px-3 py-1 text-xs font-bold text-primary min-w-[28px] text-center">
                          {item.qty}
                        </span>
                        <button
                          type="button"
                          aria-label={`Increase quantity of ${item.name}`}
                          onClick={() => handleQtyChange(item.productId, item.qty + 1)}
                          disabled={isUpdating}
                          className="px-2.5 py-1 text-secondary hover:bg-gray-100 disabled:opacity-40"
                        >
                          +
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs font-semibold px-2 py-1 bg-gray-100 rounded">
                        Qty: {item.qty}
                      </span>
                    )}

                    {/* Line Total */}
                    <div className="text-right min-w-[80px]">
                      <span className="font-bold text-sm text-primary">
                        ₹{item.lineMonthly.toLocaleString('en-IN')}
                      </span>
                      <span className="text-[11px] text-secondary block">/mo</span>
                    </div>

                    {/* Removal Explainer trigger */}
                    {!isImmutable && (
                      <button
                        type="button"
                        onClick={() => handleToggleExplain(item.productId)}
                        aria-expanded={isExplaining}
                        className="text-xs text-secondary hover:text-airtel-red underline whitespace-nowrap ml-2"
                      >
                        {isExplaining ? 'Hide impact' : 'Why keep?'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Removal Impact Accordion */}
                {isExplaining && (
                  <div className="mt-3 p-3 bg-red-50/50 border border-red-100 rounded text-xs space-y-2">
                    {explainLoading && !explanation ? (
                      <p className="text-secondary">Evaluating plan dependencies...</p>
                    ) : explanation ? (
                      <>
                        <div className="flex justify-between font-medium">
                          <span>Monthly savings if removed:</span>
                          <span className="font-bold text-emerald-700">
                            -₹{explanation.savingMonthly.toLocaleString('en-IN')} / month
                          </span>
                        </div>

                        {explanation.losesCapabilities?.length > 0 && (
                          <div>
                            <span className="font-semibold text-secondary">Capability loss:</span>
                            <ul className="list-disc pl-4 text-primary mt-0.5 space-y-0.5">
                              {explanation.losesCapabilities.map((cap, i) => (
                                <li key={i}>{cap}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {explanation.breaksDependencies?.length > 0 && (
                          <div className="p-2 bg-red-100 border border-red-300 rounded text-dark-red">
                            <span className="font-bold block mb-0.5">⚠️ Rule violation warning:</span>
                            <ul className="list-disc pl-4 space-y-0.5">
                              {explanation.breaksDependencies.map((dep, i) => (
                                <li key={i}>{dep}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        <div className="pt-2 flex justify-end">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(item.productId)}
                            className="text-dark-red font-semibold hover:underline"
                          >
                            Confirm Remove Product
                          </button>
                        </div>
                      </>
                    ) : null}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      {/* Quote Summary and Action Bar */}
      <div className="pt-4 border-t border-divider flex flex-col md:flex-row md:items-center justify-between gap-6 bg-gray-50 -mx-6 -mb-6 p-6 rounded-b-lg">
        <div className="space-y-1">
          <div className="flex items-baseline gap-2">
            <span className="text-xs uppercase font-semibold text-secondary">Total Monthly:</span>
            <span className="text-2xl font-extrabold text-primary">
              ₹{quote.monthlyTotal.toLocaleString('en-IN')}
            </span>
            <span className="text-xs text-secondary">/ month + GST</span>
          </div>
          <div className="flex gap-4 text-xs text-secondary">
            <span>One-time Setup: <strong>₹{quote.setupTotal.toLocaleString('en-IN')}</strong></span>
            <span>Contract Term: <strong>{quote.contractMonths} months</strong></span>
            <span>First Year Total: <strong>₹{quote.firstYearTotal.toLocaleString('en-IN')}</strong></span>
          </div>
        </div>

        {!isImmutable ? (
          <button
            type="button"
            onClick={onAcceptQuote}
            disabled={isUpdating}
            className="btn-primary text-sm font-semibold px-8 py-3.5 shadow-sm"
          >
            Accept Quote & Lock Price
          </button>
        ) : (
          <div className="flex items-center gap-2 text-emerald-800 bg-emerald-50 border border-emerald-200 px-4 py-2 rounded text-sm font-semibold">
            <span>✓ Pricing Locked</span>
          </div>
        )}
      </div>
    </div>
  );
}
