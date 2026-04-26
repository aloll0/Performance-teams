import api from './api';

export type CourseInput = {
  title: string;
  url?: string;
  videos?: { title?: string; url: string }[];
  platform?: string;     
  focusArea?: string;
  notes?: string;
  team?: string;
};

export type CourseVideoInput = {
  title?: string;
  url: string;
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


// export const createLearningCourse = (data: CourseInput) => {
//   return withFallback((basePath) =>
//     api.post(basePath, data, {
//       headers: {
//         Authorization: `Bearer ${}`,
//       },
//     })
//   );
// };


export const setLearningCourseCompletion = (id: string, completed: boolean) => {
  return withFallback((basePath) => api.put(`${basePath}/${id}/completion`, { completed }));
};

export const deleteLearningCourse = (id: string) => {
  return withFallback((basePath) => api.delete(`${basePath}/${id}`));
};

export const addLearningCourseVideo = (id: string, data: CourseVideoInput) => {
  return withFallback((basePath) => api.post(`${basePath}/${id}/videos`, data));
};

export const removeLearningCourseVideo = (id: string, videoId: string) => {
  return withFallback((basePath) => api.delete(`${basePath}/${id}/videos/${videoId}`));
};
