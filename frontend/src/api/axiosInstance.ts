import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_SPRING_BOOT_URL || 'http://localhost:8080',
});

// Helper to get a cookie value
const getCookie = (name: string): string | null => {
  const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
  return match ? decodeURIComponent(match[2]) : null;
};

api.interceptors.request.use((config) => {
  const token = getCookie('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
