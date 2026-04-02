import api from './api';

export const getDashboardAnalytics = () => {
  return api.get('/analytics/dashboard');
};

export const getTeamLeaderPerformance = () => {
  return api.get('/analytics/team-leaders');
};

export const getTeamAnalytics = (teamName: string) => {
  return api.get(`/analytics/team/${teamName}`);
};
