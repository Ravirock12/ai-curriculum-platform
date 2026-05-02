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

// Global response interceptor: unwrap standardized responses and handle 401
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
      // Only auto-clear if it's NOT a login request (we don't want to wipe during login attempts)
      const isLoginRequest = error.config?.url?.includes('/auth/login');
      if (!isLoginRequest) {
        localStorage.removeItem("token");
        localStorage.removeItem("userInfo");
        // Do NOT use window.location.href — it causes a hard reload that wipes React state
        // ProtectedRoute will redirect to /login automatically on the next render
      }
    }
    return Promise.reject(error);
  }
);

export default api;
