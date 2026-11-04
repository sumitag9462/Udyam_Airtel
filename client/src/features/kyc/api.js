import { apiRequest } from '../../api/client.js';

export async function recordConsent(payload) {
  return apiRequest('/kyc/consent', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function withdrawConsent(payload = {}) {
  return apiRequest('/kyc/consent/withdraw', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function uploadKycDocuments(formData) {
  return apiRequest('/kyc/upload', {
    method: 'POST',
    body: formData,
  });
}

export async function getKycCase(id) {
  return apiRequest(`/kyc/cases/${id}`);
}

export async function getReviewQueue() {
  return apiRequest('/kyc/review-queue');
}

export async function submitManualReview(id, { action, decisionNote }) {
  return apiRequest(`/kyc/cases/${id}/review`, {
    method: 'POST',
    body: JSON.stringify({ action, decisionNote }),
  });
}
