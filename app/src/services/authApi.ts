import api from './api';
import type { LoginCredentials } from '@/types';

export const login = (credentials: LoginCredentials) => {
  return api.post('/auth/login', credentials);
};

export const getCurrentUser = () => {
  return api.get('/auth/me');
};

export const changePassword = (data: { currentPassword: string; newPassword: string }) => {
  return api.post('/auth/change-password', data);
};

export const createQrLoginToken = () => {
  return api.post('/auth/qr-token');
};

export const getQrLoginStatus = (token: string) => {
  return api.get(`/auth/qr-status/${token}`);
};

export const verifyQrLoginToken = (token: string) => {
  return api.post('/auth/qr-verify', { token });
};
