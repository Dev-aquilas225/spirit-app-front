import { http } from './http.client';
import { Platform } from 'react-native';
import { StorageService } from './storage.service';

export interface LibraryBook {
  id: string;
  title: string;
  author: string;
  description?: string;
  coverUrl?: string | null;
  category?: string;
  pages?: number;
  pdfUrl?: string | null;
  tokenCost: number;   // prix en XOF (0 = gratuit)
  status: 'active' | 'inactive';
  order?: number;
  purchased?: boolean;
}

export interface BookPurchase {
  id: string;
  bookId: string;
  reference: string;
  amount: number;
  status: 'pending' | 'paid';
  book?: LibraryBook;
}

const PURCHASED_BOOKS_KEY = '@oracle/purchased_books';

export const LibraryService = {
  async getAll(category?: string): Promise<LibraryBook[]> {
    try {
      const url = category ? `/library?category=${encodeURIComponent(category)}` : '/library';
      const data = await http.get<LibraryBook[]>(url);
      return Array.isArray(data) ? data : [];
    } catch { return []; }
  },

  async getOne(id: string): Promise<LibraryBook | null> {
    try { return await http.get<LibraryBook>(`/library/${id}`); }
    catch { return null; }
  },

  async initiatePurchase(bookId: string): Promise<{ authorization_url?: string; reference?: string; error?: string; purchased?: boolean }> {
    try { return await http.post<any>(`/library/${bookId}/purchase/initiate`, {}); }
    catch (e: any) { return { error: e?.message ?? 'Erreur paiement' }; }
  },

  async verifyPurchase(reference: string): Promise<{ success: boolean; status: string; bookId?: string }> {
    try { return await http.get<any>(`/library/purchase/verify/${reference}`); }
    catch { return { success: false, status: 'error' }; }
  },

  async getMyPurchases(): Promise<BookPurchase[]> {
    try {
      const data = await http.get<BookPurchase[]>('/library/purchases/me');
      return Array.isArray(data) ? data : [];
    } catch { return []; }
  },

  async downloadBook(book: LibraryBook): Promise<{ localUri?: string; error?: string }> {
    try {
      if (!book.pdfUrl) return { error: 'Aucun PDF disponible' };
      const apiBase = (process.env.EXPO_PUBLIC_API_BASE_URL ?? 'https://api.oracle-plus.online').replace(/\/$/, '');
      const downloadUrl = `${apiBase}/api/v1/library/${book.id}/download`;

      if (Platform.OS === 'web') {
        window.open(downloadUrl, '_blank');
        return { localUri: downloadUrl };
      }

      // Natif : télécharger dans le stockage local
      const FS = await import('expo-file-system/legacy');
      const dir = `${FS.documentDirectory}oracle_books/`;
      await FS.makeDirectoryAsync(dir, { intermediates: true });
      const localPath = `${dir}${book.id}.pdf`;

      // Déjà téléchargé ?
      const info = await FS.getInfoAsync(localPath);
      if (info.exists) return { localUri: localPath };

      const token = await StorageService.get<string>('@oracle/access_token');
      const result = await FS.downloadAsync(downloadUrl, localPath, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (result.status === 200) {
        await LibraryService.savePurchasedBook(book.id, localPath);
        return { localUri: localPath };
      }
      return { error: 'Téléchargement échoué' };
    } catch (e: any) { return { error: e?.message ?? 'Erreur téléchargement' }; }
  },

  async savePurchasedBook(bookId: string, localUri: string): Promise<void> {
    const existing = await StorageService.get<Record<string, string>>(PURCHASED_BOOKS_KEY) ?? {};
    await StorageService.set(PURCHASED_BOOKS_KEY, { ...existing, [bookId]: localUri });
  },

  async getLocalUri(bookId: string): Promise<string | null> {
    const map = await StorageService.get<Record<string, string>>(PURCHASED_BOOKS_KEY) ?? {};
    return map[bookId] ?? null;
  },

  async isPurchasedLocally(bookId: string): Promise<boolean> {
    return !!(await LibraryService.getLocalUri(bookId));
  },
};

// ── Types legacy (compatibilité) ─────────────────────────────────────────────
export type CreateBookPayload = Omit<LibraryBook, 'id' | 'purchased'> & { author?: string };
export type LibraryBookStatus = 'active' | 'inactive';

// ── Méthodes admin ────────────────────────────────────────────────────────────
Object.assign(LibraryService, {
  async getAllAdmin(): Promise<LibraryBook[]> {
    try { return await http.get<LibraryBook[]>('/library/admin/books'); }
    catch { return []; }
  },
  async createBook(data: CreateBookPayload): Promise<LibraryBook> {
    return http.post<LibraryBook>('/library', data);
  },
  async updateBook(id: string, data: Partial<LibraryBook>): Promise<LibraryBook> {
    return http.patch<LibraryBook>(`/library/${id}`, data);
  },
  async updateStatus(id: string, status: LibraryBookStatus): Promise<void> {
    await http.patch(`/library/${id}`, { status });
  },
  async deleteBook(id: string): Promise<void> {
    await http.delete(`/library/${id}`);
  },
  getPdfUrl(book: LibraryBook): string | null {
    return book.pdfUrl ?? null;
  },
});
