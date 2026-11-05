/**
 * Helper to get cookie value by name
 */
export function getCookie(name) {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
}

export function getApiBase() {
  if (typeof window !== 'undefined' && window.__UDYAM_API_URL__) {
    return window.__UDYAM_API_URL__;
  }
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    if (import.meta.env.VITE_API_BASE_URL) return import.meta.env.VITE_API_BASE_URL;
    if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
    if (import.meta.env.VITE_API_BASE) return import.meta.env.VITE_API_BASE;
  }
  return '/api/v1';
}

const API_BASE = getApiBase();

let isRefreshing = false;
let refreshSubscribers = [];

function subscribeTokenRefresh(cb) {
  refreshSubscribers.push(cb);
}

function onRefreshed() {
  refreshSubscribers.forEach((cb) => cb());
  refreshSubscribers = [];
}

/**
 * Standard HTTP client with credentials, CSRF protection, and auto-refresh.
 */
export async function apiRequest(endpoint, options = {}) {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;
  const headers = new Headers(options.headers || {});

  // Add JSON Content-Type if body is present and not FormData
  if (options.body && !(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  // Double-submit CSRF protection for mutating requests
  const method = (options.method || 'GET').toUpperCase();
  if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    const csrfToken = getCookie('csrf_token') || localStorage.getItem('csrf_token');
    if (csrfToken && !headers.has('X-CSRF-Token')) {
      headers.set('X-CSRF-Token', csrfToken);
    }
  }

  // Include guest session secret if active
  if (typeof window !== 'undefined' && window.sessionStorage) {
    const sSecret = sessionStorage.getItem('udyam_advisor_sessionSecret');
    if (sSecret && !headers.has('X-Session-Secret')) {
      headers.set('X-Session-Secret', sSecret);
    }
  }

  const config = {
    ...options,
    headers,
    credentials: 'include', // send httpOnly cookies
  };

  let response;
  try {
    response = await fetch(url, config);
  } catch {
    throw new Error('Network error. Please check your connection.');
  }

  // Handle 401 Unauthorized for token refresh
  if (response.status === 401 && !endpoint.includes('/auth/')) {
    if (!isRefreshing) {
      isRefreshing = true;
      try {
        const refreshRes = await fetch(`${API_BASE}/auth/refresh`, {
          method: 'POST',
          credentials: 'include',
        });
        if (refreshRes.ok) {
          const refreshData = await refreshRes.json();
          if (refreshData.data?.csrfToken) {
            localStorage.setItem('csrf_token', refreshData.data.csrfToken);
          }
          isRefreshing = false;
          onRefreshed();
          // Retry original request
          return apiRequest(endpoint, options);
        } else {
          isRefreshing = false;
          refreshSubscribers = [];
          window.dispatchEvent(new CustomEvent('auth:expired'));
        }
      } catch {
        isRefreshing = false;
        refreshSubscribers = [];
        window.dispatchEvent(new CustomEvent('auth:expired'));
      }
    } else {
      // Queue retry after current refresh finishes
      return new Promise((resolve) => {
        subscribeTokenRefresh(() => {
          resolve(apiRequest(endpoint, options));
        });
      });
    }
  }

  let body;
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    body = await response.json();
  } else {
    const rawText = await response.text();
    // Detect HTML responses (e.g. SPA fallback from static servers)
    if (rawText.trim().toLowerCase().startsWith('<!doctype') || rawText.trim().toLowerCase().startsWith('<html')) {
      throw new Error(`API endpoint '${endpoint}' returned HTML instead of JSON. Ensure the backend server is reachable on port 3001.`);
    }
    try {
      body = JSON.parse(rawText);
    } catch {
      body = { ok: response.ok, data: rawText };
    }
  }

  if (!response.ok || (body && body.ok === false)) {
    const error = new Error(body?.error?.message || body?.message || 'Request failed');
    error.status = response.status;
    error.code = body?.error?.code || 'UNKNOWN_ERROR';
    error.details = body?.error?.details;
    throw error;
  }

  return body?.data !== undefined ? body.data : body;
}
