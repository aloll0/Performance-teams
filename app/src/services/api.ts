import axios from 'axios';
import { useAuthStore } from '@/store/authStore';

const EXPLICIT_API_BASE_URL = String(import.meta.env.VITE_API_URL || '').trim();
const LOCAL_API_BASE_URL = 'http://localhost:5001/api';

const resolveApiBaseUrl = () => {
  const isBrowser = typeof window !== 'undefined';
  const isLocalhost = isBrowser && (
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1'
  );

  if (isLocalhost) return LOCAL_API_BASE_URL;

  if (EXPLICIT_API_BASE_URL) return EXPLICIT_API_BASE_URL;

  // In deployed environments, default to same-origin API route.
  if (isBrowser) {
    return '/api';
  }

  return LOCAL_API_BASE_URL;
};

const API_BASE_URL = resolveApiBaseUrl();

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
