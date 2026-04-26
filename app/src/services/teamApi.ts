import api from './api';

export const getAllTeams = () => {
  return api.get('/teams');
};

export const getTeamById = (id: string) => {
  return api.get(`/teams/${id}`);
};

export const createTeam = (data: {
  name: string;
  description?: string;
  leaderId: string;
}) => {
  return api.post('/teams', data);
};

export const updateTeam = (id: string, data: {
  name?: string;
  description?: string;
  leaderId?: string;
}) => {
  return api.put(`/teams/${id}`, data);
};

export const deleteTeam = (id: string) => {
  return api.delete(`/teams/${id}`);
};

export const getTeamStats = (teamName: string) => {
  return api.get(`/teams/stats/${teamName}`);
};

export const getTeamEvaluationMetrics = (team?: string) => {
  return api.get('/teams/evaluation-metrics', {
    params: team ? { team } : undefined
  });
};

export const updateTeamEvaluationMetrics = (data: {
  team?: string;
  metrics: { name: string; isActive: boolean }[];
}) => {
  return api.put('/teams/evaluation-metrics', data);
};
