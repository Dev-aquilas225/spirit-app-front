import { http, ApiError } from './http.client';

export type PrayerCategory = 'morning' | 'evening' | 'protection' | 'healing' | 'prosperity' | 'deliverance' | 'family' | 'general';

export interface Prayer {
  id: string;
  title: string;
  content: string;
  reference?: string;
  category: PrayerCategory;
  isPremium: boolean;
  audioUrl?: string;
  imageUrl?: string;
  order: number;
}

export interface PrayerProgram {
  id: string;
  name: string;
  categories: PrayerCategory[];
  durationDays: number;
  startDate: string;
  userId: string;
}

export type PrayerMood = 'meditate' | 'pray' | 'worship' | 'fast' | 'read';

export interface DailyPrayer {
  id: string;
  date: string;
  period: 'morning' | 'evening';
  theme: string;
  prayerText: string;
  verse: string;
  verseReference: string;
  mood: PrayerMood;
  moodTitle: string;
  moodDescription: string;
  practiceInstruction: string;
  quanticFrequency: number | null;
  quanticDescription: string | null;
  createdAt: string;
}

export interface DailyPrayers {
  morning: DailyPrayer | null;
  evening: DailyPrayer | null;
}

export const PrayersService = {
  async getDaily(): Promise<DailyPrayers> {
    try {
      const data = await http.get<{ morning: DailyPrayer; evening: DailyPrayer }>('/prayers/daily');
      return { morning: data.morning ?? null, evening: data.evening ?? null };
    } catch {
      return { morning: null, evening: null };
    }
  },

  async getAll(category?: PrayerCategory): Promise<Prayer[]> {
    const query = category ? `?category=${category}` : '';
    try {
      return await http.get<Prayer[]>(`/prayers${query}`);
    } catch {
      return [];
    }
  },

  async getOne(id: string): Promise<Prayer | null> {
    try {
      return await http.get<Prayer>(`/prayers/${id}`);
    } catch {
      return null;
    }
  },

  async getMyPrograms(): Promise<PrayerProgram[]> {
    try {
      return await http.get<PrayerProgram[]>('/prayers/programs/me');
    } catch {
      return [];
    }
  },

  async createProgram(data: { name: string; categories?: PrayerCategory[]; durationDays?: number; startDate?: string }): Promise<{ data?: PrayerProgram; error?: string }> {
    try {
      const result = await http.post<PrayerProgram>('/prayers/programs', data);
      return { data: result };
    } catch (e) {
      return { error: (e as ApiError).message };
    }
  },

  async deleteProgram(id: string): Promise<{ error?: string }> {
    try {
      await http.delete(`/prayers/programs/${id}`);
      return {};
    } catch (e) {
      return { error: (e as ApiError).message };
    }
  },
};
