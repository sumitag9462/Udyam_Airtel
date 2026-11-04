import { apiRequest } from '../../api/client.js';

export async function createOrderFromQuote(payload) {
  const idempotencyKey =
    payload.idempotencyKey ||
    (typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `ord-idem-${Date.now()}`);

  return apiRequest('/orders', {
    method: 'POST',
    headers: {
      'Idempotency-Key': idempotencyKey,
    },
    body: JSON.stringify(payload),
  });
}

export async function getOrder(orderId) {
  return apiRequest(`/orders/${orderId}`);
}

export async function listOrders() {
  return apiRequest('/orders');
}

export async function scheduleSlot(orderId, { slotDate, timeWindow }) {
  return apiRequest(`/orders/${orderId}/slot`, {
    method: 'POST',
    body: JSON.stringify({ slotDate, timeWindow }),
  });
}

export async function simulateAdvanceOrder(orderId, { targetStatus } = {}) {
  return apiRequest(`/orders/${orderId}/simulate-advance`, {
    method: 'POST',
    body: JSON.stringify({ targetStatus }),
  });
}

export async function raiseHelpRequest(orderId, { reason, note }) {
  return apiRequest(`/orders/${orderId}/help`, {
    method: 'POST',
    body: JSON.stringify({ reason, note }),
  });
}
