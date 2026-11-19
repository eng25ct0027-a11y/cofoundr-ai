import axios from 'axios';

const api = axios.create({
  // Local dev falls back to the Vite proxy; production uses the Vercel API URL.
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
  timeout: 20000,
  headers: { 'Content-Type': 'application/json' },
});

let onUnauthorized = null;

export function setUnauthorizedHandler(handler) {
  onUnauthorized = handler;
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const isAuthCall = /\/auth\/(login|register|me|forgot-password|reset-password)/.test(
      error.config?.url || ''
    );

    if (status === 401 && !isAuthCall && onUnauthorized) {
      onUnauthorized();
    }

    const payload = error.response?.data;
    const normalized = new Error(
      payload?.message || error.message || 'Something went wrong. Please try again.'
    );
    normalized.status = status;
    normalized.errors = payload?.errors || null;
    normalized.isNetworkError = !error.response;
    throw normalized;
  }
);

export default api;
