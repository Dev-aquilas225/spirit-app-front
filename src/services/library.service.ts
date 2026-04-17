import { http, ApiError } from './http.client';
import { StorageService } from './storage.service';
import { STORAGE_KEYS } from '../utils/constants';
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

export interface CreateBookPayload {
  title: string;
  author?: string;
  description?: string;
  coverImage?: string;
  category?: string;
  pages?: number;
  order?: number;
  isFree?: boolean;
  /** Fichier PDF sélectionné (web : File, mobile : { uri, name, type }) */
  file?: File | { uri: string; name: string; type: string };
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

  /* ── Admin ───────────────────────────────────────────────────────────────── */

  /** [Admin] Liste complète des livres (tous statuts) */
  async getAllAdmin(category?: string): Promise<LibraryBook[]> {
    const query = category ? `?category=${encodeURIComponent(category)}` : '';
    try {
      return await http.get<LibraryBook[]>(`/library/admin/books${query}`);
    } catch {
      return [];
    }
  },

  /** [Admin] Créer un livre avec upload PDF */
  async createBook(payload: CreateBookPayload): Promise<{ data?: LibraryBook; error?: string }> {
    try {
      const token = await StorageService.get<string>(STORAGE_KEYS.AUTH_TOKEN);
      const baseUrl = Env.API_BASE_URL() + '/api/v1';

      const form = new FormData();
      form.append('title', payload.title);
      if (payload.author)      form.append('author',      payload.author);
      if (payload.description) form.append('description', payload.description);
      if (payload.coverImage)  form.append('coverImage',  payload.coverImage);
      if (payload.category)    form.append('category',    payload.category);
      if (payload.pages != null) form.append('pages',  String(payload.pages));
      if (payload.order != null) form.append('order',  String(payload.order));
      form.append('isFree', String(payload.isFree ?? false));

      if (payload.file) {
        if (payload.file instanceof File) {
          // Web : File natif
          form.append('file', payload.file, payload.file.name);
        } else {
          // Mobile : { uri, name, type }
          form.append('file', payload.file as unknown as Blob);
        }
      }

      const res = await fetch(`${baseUrl}/library/admin/books`, {
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
    } catch (e) {
      return { error: (e as ApiError)?.message ?? 'Erreur réseau' };
    }
  },

  /** [Admin] Changer le statut d'un livre */
  async updateStatus(id: string, status: 'draft' | 'published' | 'archived'): Promise<{ data?: LibraryBook; error?: string }> {
    try {
      const data = await http.patch<LibraryBook>(`/library/admin/books/${id}/status`, { status });
      return { data };
    } catch (e) {
      return { error: (e as ApiError).message };
    }
  },

  /* ── Public ───────────────────────────────────────────────────────────────── */

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
