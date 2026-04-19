import { http, ApiError } from './http.client';
import { StorageService } from './storage.service';
import { STORAGE_KEYS } from '../utils/constants';
import { Env } from '../utils/env';

const apiBaseUrl = () => Env.API_BASE_URL() + '/api/v1';

export interface Lesson {
  id: string;
  title: string;
  content?: string;
  videoUrl?: string;
  audioUrl?: string;
  duration?: number;
  order: number;
  // Champs fichier
  filePath?: string | null;
  fileName?: string | null;
  mimeType?: string | null;
  fileType?: 'pdf' | 'image' | 'video' | 'text' | null;
  fileUrl?: string | null;
  canRead?: boolean;
  isLocked?: boolean;
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
  isLocked?: boolean;
  canRead?: boolean;
  instructor?: string;
  isActive?: boolean;
  lessons?: Lesson[];
}

export interface FormationProgress {
  formationId: string;
  completedLessons: string[];
  progressPercent: number;
}

export interface CreateFormationPayload {
  title: string;
  description?: string;
  level?: 'beginner' | 'intermediate' | 'advanced';
  category?: string;
  duration?: number;
  isPremium?: boolean;
  instructor?: string;
  isActive?: boolean;
}

export interface CreateLessonPayload {
  title: string;
  content?: string;
  order?: number;
  fileType?: 'pdf' | 'image' | 'video' | 'text';
  file?: File | { uri: string; name: string; type: string };
}

export const FormationsService = {
  /** Retourne l'URL de streaming du fichier d'une leçon (avec auth en header) */
  getLessonFileUrl(formationId: string, lessonId: string): string {
    return `${apiBaseUrl()}/formations/${formationId}/lessons/${lessonId}/file`;
  },

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

  /* ── Admin ─────────────────────────────────────────────────────────────── */

  /** [Admin] Créer une formation */
  async adminCreateFormation(
    payload: CreateFormationPayload,
  ): Promise<{ data?: Formation; error?: string }> {
    try {
      const token = await StorageService.get<string>(STORAGE_KEYS.AUTH_TOKEN);
      const data = await http.post<Formation>('/formations', payload, token ?? undefined);
      return { data };
    } catch (e) {
      return { error: (e as ApiError)?.message ?? 'Erreur réseau' };
    }
  },

  /** [Admin] Créer une leçon (avec upload de fichier optionnel) */
  async adminCreateLesson(
    formationId: string,
    payload: CreateLessonPayload,
    file?: File | { uri: string; name: string; type: string },
  ): Promise<{ data?: Lesson; error?: string }> {
    try {
      const token = await StorageService.get<string>(STORAGE_KEYS.AUTH_TOKEN);
      const baseUrl = apiBaseUrl();

      if (file || payload.file) {
        const selectedFile = file ?? payload.file;
        const form = new FormData();
        form.append('title', payload.title);
        if (payload.content) form.append('content', payload.content);
        if (payload.order != null) form.append('order', String(payload.order));
        if (payload.fileType) form.append('fileType', payload.fileType);

        if (selectedFile) {
          if (selectedFile instanceof File) {
            form.append('file', selectedFile, selectedFile.name);
          } else {
            form.append('file', selectedFile as unknown as Blob);
          }
        }

        const res = await fetch(`${baseUrl}/formations/${formationId}/lessons`, {
          method: 'POST',
          headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          body: form,
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          return { error: body?.message ?? `Erreur ${res.status}` };
        }

        const data = await res.json();
        return { data };
      }

      // Sans fichier — JSON
      const data = await http.post<Lesson>(
        `/formations/${formationId}/lessons`,
        payload,
        token ?? undefined,
      );
      return { data };
    } catch (e) {
      return { error: (e as ApiError)?.message ?? 'Erreur réseau' };
    }
  },

  /** [Admin] Mettre à jour une formation */
  async adminUpdateFormation(
    id: string,
    payload: Partial<CreateFormationPayload>,
  ): Promise<{ data?: Formation; error?: string }> {
    try {
      const token = await StorageService.get<string>(STORAGE_KEYS.AUTH_TOKEN);
      const data = await http.patch<Formation>(`/formations/${id}`, payload, token ?? undefined);
      return { data };
    } catch (e) {
      return { error: (e as ApiError)?.message ?? 'Erreur réseau' };
    }
  },

  /** [Admin] Supprimer une formation */
  async adminDeleteFormation(id: string): Promise<{ error?: string }> {
    try {
      const token = await StorageService.get<string>(STORAGE_KEYS.AUTH_TOKEN);
      await http.delete(`/formations/${id}`, token ?? undefined);
      return {};
    } catch (e) {
      return { error: (e as ApiError)?.message ?? 'Erreur réseau' };
    }
  },
};
