import api from './api';

export type CourseInput = {
  title: string;
  url: string;
  platform?: string;
  focusArea?: string;
  notes?: string;
  team?: string;
};

const PRIMARY_BASE = '/learning-courses';
const FALLBACK_BASE = '/courses';

const withFallback = async <T>(requestFactory: (basePath: string) => Promise<T>): Promise<T> => {
  try {
    return await requestFactory(PRIMARY_BASE);
  } catch (error: any) {
    if (error?.response?.status === 404) {
      return requestFactory(FALLBACK_BASE);
    }
    throw error;
  }
};

export const getLearningCourses = (params?: { team?: string }) => {
  return withFallback((basePath) => api.get(basePath, { params }));
};

export const createLearningCourse = (data: CourseInput) => {
  return withFallback((basePath) => api.post(basePath, data));
};

export const setLearningCourseCompletion = (id: string, completed: boolean) => {
  return withFallback((basePath) => api.put(`${basePath}/${id}/completion`, { completed }));
};

export const deleteLearningCourse = (id: string) => {
  return withFallback((basePath) => api.delete(`${basePath}/${id}`));
};
