import { http, ApiError } from './http.client';
import { Env } from '../utils/env';

/**
 * Statuts réels en base : 'active' | 'inactive'
 * (le backend filtre getAll() sur status='active')
 */
export type LibraryBookStatus = 'active' | 'inactive';

/**
 * Correspond exactement à l'entité `library_books` du backend.
 */
export interface LibraryBook {
  id: string;
  title: string;
  author?: string;
  description?: string;
  /** URL absolue de la couverture (champ DB : coverUrl) */
  coverUrl?: string | null;
  category?: string;
  pages?: number;
  /** URL du fichier PDF (champ DB : pdfUrl) */
  pdfUrl?: string | null;
  tokenCost: number;
  status: LibraryBookStatus;
  createdAt?: string;
}

export interface CreateBookPayload {
  title: string;
  author?: string;
  description?: string;
  coverUrl?: string;
  category?: string;
  pages?: number;
  tokenCost?: number;
  pdfUrl?: string;
  status?: LibraryBookStatus;
}

export const LibraryService = {
  /**
   * Résout une URL de couverture :
   * - URL absolue → retournée telle quelle
   * - Chemin relatif → préfixé avec l'API base URL
   * - Absent → null
   */
  resolveCoverUrl(raw?: string | null): string | null {
    if (!raw) return null;
    if (raw.startsWith('http')) return raw;
    return `${Env.API_BASE_URL()}${raw}`;
  },

  /** URL de lecture du PDF */
  getPdfUrl(book: LibraryBook): string | null {
    if (!book.pdfUrl) return null;
    if (book.pdfUrl.startsWith('http')) return book.pdfUrl;
    return `${Env.API_BASE_URL()}${book.pdfUrl}`;
  },

  async getAll(category?: string): Promise<LibraryBook[]> {
    const query = category ? `?category=${encodeURIComponent(category)}` : '';
    try {
      const books = await http.get<any[]>(`/library${query}`);
      return books.map((b) => ({
        ...b,
        coverUrl: LibraryService.resolveCoverUrl(b.coverUrl),
        pdfUrl: b.pdfUrl ?? null,
      }));
    } catch {
      return [];
    }
  },

  /* ── Admin ─────────────────────────────────────────────────────────────── */

  async getAllAdmin(category?: string): Promise<LibraryBook[]> {
    const query = category ? `?category=${encodeURIComponent(category)}` : '';
    try {
      const books = await http.get<any[]>(`/library/admin/books${query}`);
      return books.map((b) => ({
        ...b,
        coverUrl: LibraryService.resolveCoverUrl(b.coverUrl),
        pdfUrl: b.pdfUrl ?? null,
      }));
    } catch {
      return [];
    }
  },

  async createBook(payload: CreateBookPayload): Promise<{ data?: LibraryBook; error?: string }> {
    try {
      const data = await http.post<LibraryBook>('/library', payload);
      return { data };
    } catch (e) {
      return { error: (e as ApiError)?.message ?? 'Erreur réseau' };
    }
  },

  async updateBook(
    id: string,
    payload: Partial<CreateBookPayload>,
  ): Promise<{ data?: LibraryBook; error?: string }> {
    try {
      const data = await http.patch<LibraryBook>(`/library/${id}`, payload);
      return { data };
    } catch (e) {
      return { error: (e as ApiError)?.message ?? 'Erreur réseau' };
    }
  },

  async deleteBook(id: string): Promise<{ error?: string }> {
    try {
      await http.delete(`/library/${id}`);
      return {};
    } catch (e) {
      return { error: (e as ApiError).message };
    }
  },

  async updateStatus(id: string, status: LibraryBookStatus): Promise<{ data?: LibraryBook; error?: string }> {
    try {
      const data = await http.patch<LibraryBook>(`/library/admin/books/${id}/status`, { status });
      return { data };
    } catch (e) {
      return { error: (e as ApiError).message };
    }
  },

  /* ── Public ─────────────────────────────────────────────────────────────── */

  async getOne(id: string): Promise<{ data?: LibraryBook; error?: string }> {
    try {
      const raw = await http.get<any>(`/library/${id}`);
      const data: LibraryBook = {
        ...raw,
        coverUrl: LibraryService.resolveCoverUrl(raw.coverUrl),
        pdfUrl: raw.pdfUrl ?? null,
      };
      return { data };
    } catch (e) {
      return { error: (e as ApiError).message };
    }
  },
};
