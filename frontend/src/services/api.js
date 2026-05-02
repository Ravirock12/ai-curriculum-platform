import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api',
});

// Attach token automatically to every request.
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Global response interceptor: log 401s clearly for debugging and unwrap standardized backend responses
api.interceptors.response.use(
  (response) => {
    // Seamlessly unwrap the { success: true, data: {} } standardized backend format
    if (response.data && typeof response.data === 'object' && response.data.success === true && response.data.data !== undefined) {
      response.data = response.data.data;
    }
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      console.warn('[API] 401 Unauthorized — token may be missing or expired.');
      // Auto-logout on token expiration
      localStorage.removeItem("token");
      localStorage.removeItem("userInfo");
      if (window.location.pathname !== '/login' && window.location.pathname !== '/') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
