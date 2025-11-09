import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:61651/',
  timeout: 10000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("ft_access");

 
  const excludedEndpoints = ['/login', '/register'];
 
  const isExcluded = excludedEndpoints.some(endpoint => config.url.includes(endpoint));
 
  if (token && !isExcluded) {
    config.headers.Authorization = `Bearer ${token}`;
  }
 
  return config;
});

export default api;
