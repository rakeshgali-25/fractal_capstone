import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/';

const api = axios.create({
  baseURL,
  timeout: 10000,
});

// --- Helper: Refresh access token ---
let isRefreshing = false;
let refreshSubscribers = [];

function onRefreshed(newToken) {
  refreshSubscribers.forEach((cb) => cb(newToken));
  refreshSubscribers = [];
}

function addRefreshSubscriber(cb) {
  refreshSubscribers.push(cb);
}

// --- Attach access token to all requests except auth endpoints ---
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('ft_access');
  const excludedEndpoints = ['/login', '/register', '/token/refresh'];
  const isExcluded = excludedEndpoints.some((endpoint) =>
    config.url.includes(endpoint)
  );

  if (token && !isExcluded) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// --- Response interceptor: handle expired tokens (401) ---
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If no response or already retried once, reject
    if (!error.response) return Promise.reject(error);
    if (error.response.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    // Avoid retrying multiple times in parallel
    if (isRefreshing) {
      // Wait until token refreshed
      return new Promise((resolve) => {
        addRefreshSubscriber((newToken) => {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          resolve(api(originalRequest));
        });
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const refreshToken = localStorage.getItem('ft_refresh');
      if (!refreshToken) throw new Error('No refresh token found');

      const response = await axios.post(`${baseURL}api/token/refresh/`, {
        refresh: refreshToken,
      });

      const newAccess = response.data.access;
      if (!newAccess) throw new Error('No new access token received');

      // Store new token
      localStorage.setItem('ft_access', newAccess);

      // Notify all subscribers
      onRefreshed(newAccess);

      // Retry the original request
      originalRequest.headers.Authorization = `Bearer ${newAccess}`;
      return api(originalRequest);
    } catch (refreshError) {
      console.error('Token refresh failed:', refreshError);
      // Optional: logout user automatically
      localStorage.removeItem('ft_access');
      localStorage.removeItem('ft_refresh');
      window.location.href = '/login';
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default api;
