import api from './api';

export const getAllUsers = (params?: { role?: string; team?: string; search?: string }) => {
  return api.get('/users', { params });
};

export const getUserById = (id: string) => {
  return api.get(`/users/${id}`);
};

export const createUser = (data: {
  name: string;
  email: string;
  password: string;
  role: string;
  team?: string;
  level?: string;
}) => {
  return api.post('/users', data);
};

export const updateUser = (id: string, data: {
  name?: string;
  email?: string;
  team?: string;
  level?: string;
  isActive?: boolean;
}) => {
  return api.put(`/users/${id}`, data);
};

export const deleteUser = (id: string) => {
  return api.delete(`/users/${id}`);
};

export const adminResetUserPassword = (id: string, data: { newPassword: string }) => {
  return api.post(`/users/${id}/reset-password`, data);
};

export const updateMyAvatar = (data: { avatar: string }) => {
  return api.put('/users/me/avatar', data);
};

export const removeMyAvatar = () => {
  return api.delete('/users/me/avatar');
};

export const getEmployeesByTeam = (team: string) => {
  return api.get(`/users/team/${team}`);
};

export const getTeamLeaders = () => {
  return api.get('/users/team-leaders');
};

export const moveEmployee = (data: { employeeId: string; newTeam: string }) => {
  return api.post('/users/move', data);
};
