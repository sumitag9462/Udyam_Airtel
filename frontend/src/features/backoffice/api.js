import { apiRequest } from '../../api/client.js';

export async function getFunnelMetrics(origin = 'seed') {
  return apiRequest(`/backoffice/funnel?origin=${origin}`);
}

export async function getUnclosedLeads(params = {}) {
  const query = new URLSearchParams(params).toString();
  return apiRequest(`/backoffice/unclosed-leads?${query}`);
}

export async function getSegmentAnalytics() {
  return apiRequest('/backoffice/segments');
}

export async function getSourceAnalytics() {
  return apiRequest('/backoffice/sources');
}

export async function updateLeadStatus(id, payload) {
  return apiRequest(`/backoffice/leads/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}
