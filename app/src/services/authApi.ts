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
