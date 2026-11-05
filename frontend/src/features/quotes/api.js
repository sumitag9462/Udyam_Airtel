import { apiRequest } from '../../api/client.js';

export async function fetchCatalogue(params = {}) {
  const query = new URLSearchParams(params).toString();
  const endpoint = `/catalogue${query ? `?${query}` : ''}`;
  return apiRequest(endpoint);
}

export async function fetchBundles(profile) {
  return apiRequest('/rules/bundles', {
    method: 'POST',
    body: JSON.stringify(profile),
  });
}

export async function createQuote(data) {
  return apiRequest('/quotes', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getQuote(quoteId) {
  return apiRequest(`/quotes/${quoteId}`);
}

export async function updateQuoteItems(quoteId, lineItems) {
  return apiRequest(`/quotes/${quoteId}/items`, {
    method: 'PATCH',
    body: JSON.stringify({ lineItems }),
  });
}

export async function explainProductRemoval(quoteId, productId, payload = {}) {
  if (quoteId && quoteId !== 'DRAFT-PREVIEW') {
    return apiRequest(`/quotes/${quoteId}/explain/${productId}`);
  }
  return apiRequest('/rules/explain', {
    method: 'POST',
    body: JSON.stringify({ productId, ...payload }),
  });
}

export async function previewQuoteScenario(quoteId, scenario, payload = {}) {
  if (quoteId && quoteId !== 'DRAFT-PREVIEW') {
    return apiRequest(`/quotes/${quoteId}/preview`, {
      method: 'POST',
      body: JSON.stringify({ scenario }),
    });
  }
  return apiRequest('/rules/preview', {
    method: 'POST',
    body: JSON.stringify({ scenario, ...payload }),
  });
}

export async function computeQuotePreview(lineItems) {
  return apiRequest('/rules/compute', {
    method: 'POST',
    body: JSON.stringify({ lineItems }),
  });
}

export async function acceptQuote(quoteId, idempotencyKey) {
  return apiRequest(`/quotes/${quoteId}/accept`, {
    method: 'POST',
    headers: {
      'Idempotency-Key': idempotencyKey,
    },
  });
}
