import api from './api';

export const getAllQuizzes = (params?: { isActive?: boolean }) => {
  return api.get('/quizzes', { params });
};

export const getQuizById = (id: string) => {
  return api.get(`/quizzes/${id}`);
};

export const createQuiz = (data: {
  title: string;
  description?: string;
  targetTeam?: string | null;
  questions: {
    question: string;
    options: string[];
    correctAnswer: number;
    points?: number;
  }[];
  timeLimit?: number;
}) => {
  return api.post('/quizzes', data);
};

export const updateQuiz = (id: string, data: {
  title?: string;
  description?: string;
  targetTeam?: string | null;
  questions?: {
    question: string;
    options: string[];
    correctAnswer: number;
    points?: number;
  }[];
  timeLimit?: number;
  isActive?: boolean;
}) => {
  return api.put(`/quizzes/${id}`, data);
};

export const deleteQuiz = (id: string) => {
  return api.delete(`/quizzes/${id}`);
};

export const submitQuiz = (id: string, data: { answers: { selectedAnswer: number }[] }) => {
  return api.post(`/quizzes/${id}/submit`, data);
};

export const getUserQuizResults = (userId: string) => {
  return api.get(`/quizzes/results/user/${userId}`);
};

export const getAllQuizResults = () => {
  return api.get('/quizzes/results/all');
};
