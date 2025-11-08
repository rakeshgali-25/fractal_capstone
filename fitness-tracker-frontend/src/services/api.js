import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:7000/',
  timeout: 10000,
});

api.interceptors.request.use((config) => {
  const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzYyNjA5MTY2LCJpYXQiOjE3NjI2MDYxNjYsImp0aSI6ImJiNTRhY2UyMmRhNDQyNDlhNWQ4OGU0Yjg0NzRhNDVhIiwidXNlcl9pZCI6IjcifQ._OC2dZ9rXJSR9-1ySPDCA8B6wz0q4t2KdBJc8NUJjmQ";
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
