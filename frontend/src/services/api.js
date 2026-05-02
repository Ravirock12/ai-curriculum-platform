import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api',
});

// Attach token automatically to every request.
// Reads from 'token' key (set during login) with fallback to 'userInfo' for legacy support.
api.interceptors.request.use(
  (config) => {
    // Primary: direct token key
    let token = localStorage.getItem('token');

    // Fallback: userInfo object (legacy format)
    if (!token) {
      const userInfo = localStorage.getItem('userInfo');
      if (userInfo) {
        try {
          const parsed = JSON.parse(userInfo);
          token = parsed.token;
        } catch (_) {}
      }
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Global response interceptor: log 401s clearly for debugging
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn('[API] 401 Unauthorized — token may be missing or expired.');
    }
    return Promise.reject(error);
  }
);

export default api;
