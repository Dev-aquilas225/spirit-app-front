import { http } from './http.client';
import { Platform } from 'react-native';
import { StorageService } from './storage.service';
import { STORAGE_KEYS } from '../utils/constants';

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
      // /library/purchases/me quand déployé, fallback sur /library/purchases
      const data = await http.get<BookPurchase[]>('/library/purchases/me').catch(
        () => http.get<BookPurchase[]>('/library/purchases')
      );
      return Array.isArray(data) ? data : [];
    } catch { return []; }
  },

  async downloadBook(book: LibraryBook): Promise<{ localUri?: string; error?: string }> {
    try {
      if (!book.pdfUrl) return { error: 'Aucun PDF disponible' };
      const apiBase = (process.env.EXPO_PUBLIC_API_BASE_URL ?? 'https://api.oracle-plus.online').replace(/\/$/, '');
      const downloadUrl = `${apiBase}/api/v1/library/${book.id}/download`;

      if (Platform.OS === 'web') {
        // Sur web : fetch avec token puis déclencher le téléchargement via blob
        const token = await StorageService.get<string>(STORAGE_KEYS.AUTH_TOKEN);
        const resp = await fetch(downloadUrl, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!resp.ok) {
          const err = await resp.json().catch(() => ({}));
          return { error: (err as any).message ?? 'Téléchargement refusé' };
        }
        const blob = await resp.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${book.title.replace(/[^a-z0-9]/gi, '_')}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        return { localUri: downloadUrl };
      }

      // Natif : télécharger dans le stockage local
      const FS = await import('expo-file-system/legacy');
      const dir = `${FS.documentDirectory}oracle_books/`;
      await FS.makeDirectoryAsync(dir, { intermediates: true });
      const localPath = `${dir}${book.id}.pdf`;

      // Vérifier si déjà téléchargé ET non vide (évite les fichiers corrompus)
      const info = await FS.getInfoAsync(localPath);
      if (info.exists && (info as any).size > 1024) return { localUri: localPath };

      // Supprimer un éventuel fichier corrompu avant de re-télécharger
      if (info.exists) {
        await FS.deleteAsync(localPath, { idempotent: true });
      }

      const token = await StorageService.get<string>(STORAGE_KEYS.AUTH_TOKEN);
      const result = await FS.downloadAsync(downloadUrl, localPath, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (result.status === 200) {
        // Vérifier que le fichier téléchargé n'est pas vide
        const downloaded = await FS.getInfoAsync(localPath);
        if (!downloaded.exists || (downloaded as any).size < 1024) {
          await FS.deleteAsync(localPath, { idempotent: true });
          return { error: 'Fichier PDF invalide ou vide' };
        }
        await LibraryService.savePurchasedBook(book.id, localPath);
        return { localUri: localPath };
      }
      if (result.status === 401 || result.status === 403) {
        return { error: 'Accès refusé — veuillez débloquer ce livre d\'abord' };
      }
      return { error: `Téléchargement échoué (HTTP ${result.status})` };
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

  /** Upload générique vers une route backend — retourne l'URL publique */
  async _uploadFile(
    endpoint: string,
    fileUri: string,
    fileName: string,
    mimeType: string,
  ): Promise<string> {
    const { StorageService } = await import('./storage.service');
    const { STORAGE_KEYS } = await import('../utils/constants');
    const token = await StorageService.get<string>(STORAGE_KEYS.AUTH_TOKEN);
    const apiBase = (process.env.EXPO_PUBLIC_API_BASE_URL ?? 'https://api.oracle-plus.online').replace(/\/$/, '');

    // Sur Android, content:// URIs ne sont pas lisibles directement par fetch.
    // Copier d'abord dans le cache via expo-file-system.
    let uploadUri = fileUri;
    if (Platform.OS !== 'web' && (fileUri.startsWith('content://') || fileUri.startsWith('ph://'))) {
      const FS = await import('expo-file-system/legacy');
      const ext = fileName.split('.').pop() ?? 'jpg';
      const dest = `${FS.cacheDirectory}upload_${Date.now()}.${ext}`;
      await FS.copyAsync({ from: fileUri, to: dest });
      uploadUri = dest;
    }

    const form = new FormData();
    form.append('file', { uri: uploadUri, name: fileName, type: mimeType } as any);

    const res = await fetch(`${apiBase}/api/v1${endpoint}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token ?? ''}`,
        Accept: 'application/json',
        // PAS de Content-Type — React Native l'injecte avec le boundary multipart
      },
      body: form,
    });

    const text = await res.text();
    let data: any;
    try { data = JSON.parse(text); } catch { throw new Error(`Réponse invalide: ${text.slice(0, 100)}`); }

    if (!res.ok || data.error) throw new Error(data.error ?? data.message ?? `Erreur ${res.status}`);
    if (!data.url) throw new Error('URL manquante dans la réponse');
    return data.url as string;
  },

  /** Upload une image de couverture → retourne l'URL publique */
  async uploadCover(fileUri: string, mimeType = 'image/jpeg'): Promise<string> {
    return (LibraryService as any)._uploadFile('/library/upload/cover', fileUri, 'cover.jpg', mimeType);
  },

  /** Upload un PDF → retourne l'URL publique */
  async uploadPdf(fileUri: string, mimeType = 'application/pdf'): Promise<string> {
    return (LibraryService as any)._uploadFile('/library/upload/pdf', fileUri, 'book.pdf', mimeType);
  },
});
