import api from './api';
import type { Criterion } from '@/types';

export const getAllEvaluations = (params?: {
  employeeId?: string;
  month?: string;
  year?: string;
  team?: string;
}) => {
  return api.get('/evaluations', { params });
};

export const getEvaluationById = (id: string) => {
  return api.get(`/evaluations/${id}`);
};

export const getEmployeeEvaluationHistory = (employeeId: string) => {
  return api.get(`/evaluations/employee/${employeeId}/history`);
};

export const getEmployeeStats = (employeeId: string) => {
  return api.get(`/evaluations/employee/${employeeId}/stats`);
};

export const createOrUpdateEvaluation = (data: {
  employeeId: string;
  month: string;
  year: number;
  criteria: Criterion[];
  notes?: string;
}) => {
  return api.post('/evaluations', data);
};
