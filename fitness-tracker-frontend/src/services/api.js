import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:53394/',
  timeout: 10000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('ft_access');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
