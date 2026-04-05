import { http, ApiError } from './http.client';

export interface Book {
  id: string;
  title: string;
  author?: string;
  description?: string;
  coverImage?: string;
  fileUrl?: string;
  category?: string;
  pages?: number;
  isPremium: boolean;
}

export const LibraryService = {
  async getAll(category?: string): Promise<Book[]> {
    const query = category ? `?category=${encodeURIComponent(category)}` : '';
    try {
      return await http.get<Book[]>(`/library${query}`);
    } catch {
      return [];
    }
  },

  async getOne(id: string): Promise<{ data?: Book; error?: string }> {
    try {
      const data = await http.get<Book>(`/library/${id}`);
      return { data };
    } catch (e) {
      return { error: (e as ApiError).message };
    }
  },
};
