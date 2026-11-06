import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useParams, Link } from 'react-router-dom';
import OrderTimeline from '../features/tracker/OrderTimeline.jsx';
import SlotPicker from '../features/tracker/SlotPicker.jsx';
import SimulateAdvanceControl from '../features/tracker/SimulateAdvanceControl.jsx';
import HelpModal from '../features/tracker/HelpModal.jsx';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';
import { createOrderFromQuote, getOrder, listOrders } from '../features/tracker/api.js';

export default function TrackerPage() {
  const { id: routeOrderId, orderId: routeParamOrderId } = useParams();
  const [searchParams] = useSearchParams();
  const quoteId = searchParams.get('quoteId') || null;
  const orderParam = routeOrderId || routeParamOrderId || searchParams.get('orderId') || null;

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showHelpModal, setShowHelpModal] = useState(false);

  const loadOrder = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (orderParam && orderParam !== 'ORD-NEW') {
        const data = await getOrder(orderParam);
        setOrder(data);
      } else if (quoteId) {
        // Create order idempotently or retrieve existing
        const data = await createOrderFromQuote({ quoteId });
        setOrder(data);
      } else {
        // Find most recent order for current user
        const orders = await listOrders();
        if (orders && orders.length > 0) {
          setOrder(orders[0]);
        } else {
          setOrder(null);
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to load order');
    } finally {
      setLoading(false);
    }
  }, [orderParam, quoteId]);

  useEffect(() => {
    loadOrder();
  }, [loadOrder]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      {/* Main Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8">
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl mb-6">
            {error}
          </div>
        )}

        {loading ? (
          <div className="p-12 text-center text-sm text-gray-500">
            <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            Connecting to Airtel provisioning network...
          </div>
        ) : !order ? (
          <div className="bg-white border border-gray-200 rounded-xl p-12 text-center shadow-sm">
            <div className="text-3xl mb-2">📦</div>
            <h3 className="font-bold text-gray-900 text-lg">No Active Orders Found</h3>
            <p className="text-sm text-gray-500 max-w-md mx-auto mt-1 mb-6">
              You do not have an active provisioning order yet. Accept a tailored quote and complete KYC to start installation.
            </p>
            <Link
              to="/quotes"
              className="px-6 py-2.5 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 transition"
            >
              Browse Quotes →
            </Link>
          </div>
        ) : (
          <>
            {/* Jury Demo Simulator Fast-Forward Control */}
            <SimulateAdvanceControl
              order={order}
              onAdvanced={(updated) => setOrder(updated)}
            />

            {/* Vertical Delivery Stepper */}
            <OrderTimeline order={order} />

            {/* Interactive Slot Scheduling (shown when appropriate) */}
            {['KYC_VERIFIED', 'FEASIBILITY_CHECK', 'INSTALL_SCHEDULED'].includes(order.status) && (
              <SlotPicker
                orderId={order.orderId}
                currentSlot={order.selectedSlot}
                onSlotScheduled={(updated) => setOrder(updated)}
              />
            )}

            {/* Order Summary & Customer Care Card */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h4 className="font-bold text-gray-900 text-sm">Need Special Wiring or Routing?</h4>
                <p className="text-xs text-gray-500">
                  Leave a note for the technician or request an instant callback. Zero call-center queue time.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowHelpModal(true)}
                className="px-5 py-2.5 border border-gray-300 hover:bg-gray-50 rounded-xl text-xs font-semibold text-gray-700 transition shrink-0"
              >
                Proactive Support Note →
              </button>
            </div>
          </>
        )}
      </main>

      {/* Proactive Help Modal */}
      {showHelpModal && order && (
        <HelpModal
          orderId={order.orderId}
          onClose={() => setShowHelpModal(false)}
        />
      )}

      <Footer />
    </div>
  );
}
