import axios from 'axios';

/**
 * Universal Axios API Client for SaveBuddy
 * Preconfigured with baseURL, interceptors, auth token injection, and unified error handling (EC-1.6).
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach Auth Token if Available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('savebuddy_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle Global Errors & Network Drops (EC-1.6)
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    // EC-1.6: Network Disconnection or Server Unreachable
    if (!error.response) {
      const offlineError = {
        code: 'NETWORK_ERROR',
        message: 'Network error: Unable to reach the SaveBuddy server. Please check your connection.',
      };
      return Promise.reject(offlineError);
    }

    // Extract standardized error from backend envelope
    const backendError = error.response.data?.error || {
      code: error.response.data?.code || 'API_ERROR',
      message: error.response.data?.message || error.message || 'An error occurred during the request.',
    };

    // Handle Token Expiration (Module 2 preparation)
    if (error.response.status === 401 && backendError.code === 'TOKEN_EXPIRED') {
      localStorage.removeItem('savebuddy_token');
      // Window redirect if not on login page
      if (window.location.pathname !== '/login') {
        window.location.href = '/login?expired=true';
      }
    }

    return Promise.reject(backendError);
  }
);

/**
 * System Health Service
 */
export const fetchSystemHealth = async () => {
  return await api.get('/health');
};

export default api;
