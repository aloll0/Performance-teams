import api from './api';

export const submitMyWorkLog = (data: {
  date: string;
  items: { task: string; hours: number; notes?: string }[];
}) => {
  return api.post('/work-logs/me', data);
};

export const getMyWorkLogs = () => {
  return api.get('/work-logs/me');
};

export const getTeamWorkLogs = (params?: { date?: string; employeeId?: string }) => {
  return api.get('/work-logs/team', { params });
};

export const reviewWorkLog = (id: string, data: { leaderComment?: string }) => {
  return api.put(`/work-logs/${id}/review`, data);
};
