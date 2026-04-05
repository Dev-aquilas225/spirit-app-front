import { http, ApiError } from './http.client';

export interface Lesson {
  id: string;
  title: string;
  content?: string;
  videoUrl?: string;
  audioUrl?: string;
  duration?: number;
  order: number;
}

export interface Formation {
  id: string;
  title: string;
  description: string;
  coverImage?: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  category?: string;
  duration?: number;
  isPremium: boolean;
  lessons?: Lesson[];
}

export interface FormationProgress {
  formationId: string;
  completedLessons: string[];
  progressPercent: number;
}

export const FormationsService = {
  async getAll(): Promise<Formation[]> {
    try {
      return await http.get<Formation[]>('/formations');
    } catch {
      return [];
    }
  },

  async getOne(id: string): Promise<{ data?: Formation; error?: string }> {
    try {
      const data = await http.get<Formation>(`/formations/${id}`);
      return { data };
    } catch (e) {
      return { error: (e as ApiError).message };
    }
  },

  async getLesson(formationId: string, lessonId: string): Promise<{ data?: Lesson; error?: string }> {
    try {
      const data = await http.get<Lesson>(`/formations/${formationId}/lessons/${lessonId}`);
      return { data };
    } catch (e) {
      return { error: (e as ApiError).message };
    }
  },

  async getMyProgress(): Promise<FormationProgress[]> {
    try {
      return await http.get<FormationProgress[]>('/formations/progress/me');
    } catch {
      return [];
    }
  },

  async updateProgress(formationId: string, lessonId: string): Promise<{ error?: string }> {
    try {
      await http.post(`/formations/${formationId}/progress`, { lessonId });
      return {};
    } catch (e) {
      return { error: (e as ApiError).message };
    }
  },
};
