import { create } from 'zustand';
import { apiRequest } from '../api/client.js';

export const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  setUser: (user) => set({ user, isAuthenticated: Boolean(user), isLoading: false }),

  checkAuth: async () => {
    try {
      set({ isLoading: true, error: null });
      const data = await apiRequest('/auth/me');
      set({ user: data.user, isAuthenticated: true, isLoading: false });
    } catch {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  requestOtp: async (phone) => {
    set({ error: null });
    const data = await apiRequest('/auth/otp/request', {
      method: 'POST',
      body: JSON.stringify({ phone }),
    });
    return data;
  },

  verifyOtp: async (phone, code, metadata = {}) => {
    set({ error: null });
    const data = await apiRequest('/auth/otp/verify', {
      method: 'POST',
      body: JSON.stringify({
        phone,
        code,
        ...(metadata?.conversationId ? { conversationId: metadata.conversationId } : {}),
        ...(metadata?.sessionSecret ? { sessionSecret: metadata.sessionSecret } : {}),
      }),
    });
    if (data.csrfToken) {
      localStorage.setItem('csrf_token', data.csrfToken);
    }
    set({ user: data.user, isAuthenticated: true });
    return data;
  },

  staffLogin: async (email, password) => {
    set({ error: null });
    const data = await apiRequest('/auth/staff/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (data.csrfToken) {
      localStorage.setItem('csrf_token', data.csrfToken);
    }
    set({ user: data.user, isAuthenticated: true });
    return data;
  },

  logout: async () => {
    try {
      await apiRequest('/auth/logout', { method: 'POST' });
    } finally {
      localStorage.removeItem('csrf_token');
      set({ user: null, isAuthenticated: false });
    }
  },
}));

// Listen for global auth expiration events from API client
if (typeof window !== 'undefined') {
  window.addEventListener('auth:expired', () => {
    useAuthStore.getState().setUser(null);
  });
}
