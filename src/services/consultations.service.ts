import { http, ApiError } from './http.client';

export type ConsultationType =
  | 'general' | 'specific_case' | 'dream_interpretation' | 'prayer_follow_up'
  | 'marriage' | 'work' | 'exam' | 'children' | 'spiritual_combat'
  | 'personalized_program' | 'orientation' | 'prophetic_reading'
  | 'travel_project' | 'clarification';

export type ConsultationStatus = 'pending' | 'in_progress' | 'answered' | 'closed';

export interface Consultation {
  id: string;
  type: ConsultationType;
  description: string;
  status: ConsultationStatus;
  response?: string;
  attachmentUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export const ConsultationsService = {
  async create(data: { type: ConsultationType; description: string; attachmentUrl?: string }): Promise<{ data?: Consultation; error?: string }> {
    try {
      const result = await http.post<Consultation>('/consultations', data);
      return { data: result };
    } catch (e) {
      return { error: (e as ApiError).message };
    }
  },

  async getMine(): Promise<Consultation[]> {
    try {
      return await http.get<Consultation[]>('/consultations/me');
    } catch {
      return [];
    }
  },

  async getOne(id: string): Promise<{ data?: Consultation; error?: string }> {
    try {
      const data = await http.get<Consultation>(`/consultations/me/${id}`);
      return { data };
    } catch (e) {
      return { error: (e as ApiError).message };
    }
  },
};
