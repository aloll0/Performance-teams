import axios from 'axios';
import { useAuthStore } from '@/store/authStore';

const EXPLICIT_API_BASE_URL = String(import.meta.env.VITE_API_URL || '').trim();

const isLocalHostname = (hostname: string) => hostname === 'localhost' || hostname === '127.0.0.1';

const getHostnameFromUrl = (value: string) => {
  try {
    return new URL(value).hostname;
  } catch {
    return null;
  }
};

const resolveApiBaseUrl = () => {
  const runningInBrowser = typeof window !== 'undefined';
  const runningOnLocalhost = runningInBrowser && isLocalHostname(window.location.hostname);

  if (EXPLICIT_API_BASE_URL) {
    const explicitHost = getHostnameFromUrl(EXPLICIT_API_BASE_URL);
    const explicitIsLocal = explicitHost ? isLocalHostname(explicitHost) : false;

    // In local development, prefer local proxy when env points to remote production API.
    if (!(runningOnLocalhost && !explicitIsLocal)) {
      return EXPLICIT_API_BASE_URL;
    }
  }

  return '/api';
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
