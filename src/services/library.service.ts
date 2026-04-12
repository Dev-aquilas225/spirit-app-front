import { http, ApiError } from './http.client';
import { Env } from '../utils/env';

const apiBaseUrl = () => Env.API_BASE_URL() + '/api/v1';

export type LibraryBookStatus = 'draft' | 'published' | 'archived';

export interface LibraryBook {
  id: string;
  title: string;
  author?: string;
  description?: string;
  coverImage?: string;
  category?: string;
  pages?: number;
  fileUrl?: string | null;
  fileName?: string | null;
  mimeType?: string;
  status: LibraryBookStatus;
  isFree: boolean;
  isPremium: boolean;
  isLocked: boolean;
  canRead: boolean;
  hasPdf: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export const LibraryService = {
  getFileUrl(bookId: string): string {
    return `${apiBaseUrl()}/library/${bookId}/file`;
  },

  async getAll(category?: string): Promise<LibraryBook[]> {
    const query = category ? `?category=${encodeURIComponent(category)}` : '';
    try {
      const books = await http.get<LibraryBook[]>(`/library${query}`);
      return books.map((book) => ({
        ...book,
        fileUrl: book.fileUrl ?? LibraryService.getFileUrl(book.id),
      }));
    } catch {
      return [];
    }
  },

  async getOne(id: string): Promise<{ data?: LibraryBook; error?: string }> {
    try {
      const data = await http.get<LibraryBook>(`/library/${id}`);
      return {
        data: {
          ...data,
          fileUrl: data.fileUrl ?? LibraryService.getFileUrl(data.id),
        },
      };
    } catch (e) {
      return { error: (e as ApiError).message };
    }
  },
};
