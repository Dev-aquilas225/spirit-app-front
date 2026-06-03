/**
 * Librairie Service — Oracle Plus
 *
 * Règles métier :
 * - Chaque livre a un prix en FCFA (1 FCFA = 1 crédit).
 * - L'abonnement actif NE donne PAS accès aux livres.
 * - Tout le monde paie avec Paystack directement.
 * - Après paiement validé, le PDF est téléchargeable et lisible en ligne.
 * - Les PDF sont servis uniquement via le backend après vérification d'achat.
 */
import { StorageService } from './storage.service';
import { STORAGE_KEYS } from '../utils/constants';

const API = () =>
  (process.env.EXPO_PUBLIC_API_BASE_URL ?? 'https://api.oracle-plus.online').replace(/\/$/, '');

// ── Types ─────────────────────────────────────────────────────────────────────

export interface Livre {
  id: string;
  title: string;
  author?: string;
  shortDescription?: string;
  description?: string;
  category?: string;
  coverUrl?: string;
  pdfUrl?: string;
  priceFcfa: number;
  status: 'active' | 'inactive';
  purchased?: boolean;
  purchasedAt?: string;
  purchaseCount?: number;
  downloadCount?: number;
}

export interface LivreAchat {
  id: string;
  livreId: string;
  reference: string;
  amount: number;
  status: 'pending' | 'paid' | 'success';
  paidAt?: string;
  createdAt: string;
  book?: Livre;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

async function authHeaders(): Promise<Record<string, string>> {
  const token = await StorageService.get<string>(STORAGE_KEYS.AUTH_TOKEN);
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function normalizeBook(b: any): Livre {
  return {
    id:               b.id,
    title:            b.title ?? '',
    author:           b.author,
    shortDescription: b.shortDescription ?? b.excerpt,
    description:      b.description ?? b.fullDescription,
    category:         b.category,
    coverUrl:         b.coverUrl,
    pdfUrl:           b.pdfUrl,
    priceFcfa:        b.tokenCost ?? b.priceFcfa ?? b.price ?? 0,
    status:           b.status ?? 'active',
    purchased:        b.purchased ?? false,
    purchasedAt:      b.purchasedAt,
    purchaseCount:    b.purchaseCount ?? b._count?.purchases,
    downloadCount:    b.downloadCount ?? b._count?.downloads,
  };
}

// ── Service ───────────────────────────────────────────────────────────────────

export const LibrairieService = {

  async getAll(category?: string): Promise<Livre[]> {
    try {
      const headers = await authHeaders();
      const url = category
        ? `${API()}/api/v1/library?category=${encodeURIComponent(category)}`
        : `${API()}/api/v1/library`;
      const res = await fetch(url, { headers });
      if (!res.ok) return [];
      const data = await res.json();
      return (Array.isArray(data) ? data : []).map(normalizeBook);
    } catch { return []; }
  },

  async getOne(id: string): Promise<Livre | null> {
    try {
      const headers = await authHeaders();
      const res = await fetch(`${API()}/api/v1/library/${id}`, { headers });
      if (!res.ok) return null;
      return normalizeBook(await res.json());
    } catch { return null; }
  },

  async getMyPurchases(): Promise<LivreAchat[]> {
    try {
      const headers = await authHeaders();
      let res = await fetch(`${API()}/api/v1/library/purchases/me`, { headers });
      if (!res.ok) res = await fetch(`${API()}/api/v1/library/purchases`, { headers });
      if (!res.ok) return [];
      const data = await res.json();
      return (Array.isArray(data) ? data : []).map((p: any) => ({
        id:        p.id ?? p.bookId ?? p.livreId,
        livreId:   p.bookId ?? p.livreId,
        reference: p.reference ?? p.paystackRef ?? '',
        amount:    p.amount ?? 0,
        status:    p.status ?? 'pending',
        paidAt:    p.paidAt ?? p.updatedAt,
        createdAt: p.createdAt,
        book:      p.book ? normalizeBook(p.book) : undefined,
      }));
    } catch { return []; }
  },

  async initierPaiement(livreId: string): Promise<{
    authorizationUrl?: string;
    reference?: string;
    error?: string;
    alreadyPurchased?: boolean;
  }> {
    try {
      const headers = { ...(await authHeaders()), 'Content-Type': 'application/json' };
      // Route backend : POST /library/pay/:id
      let res = await fetch(`${API()}/api/v1/library/pay/${livreId}`, {
        method: 'POST', headers, body: JSON.stringify({}),
      });
      // Fallbacks pour compatibilité
      if (res.status === 404) {
        res = await fetch(`${API()}/api/v1/library/${livreId}/pay`, {
          method: 'POST', headers, body: JSON.stringify({}),
        });
      }
      if (res.status === 404) {
        res = await fetch(`${API()}/api/v1/library/${livreId}/purchase/initiate`, {
          method: 'POST', headers, body: JSON.stringify({}),
        });
      }
      const data = await res.json();
      // Détecter "déjà acheté" quelle que soit la réponse HTTP
      if (data?.alreadyPurchased || data?.purchased === true || data?.error?.toLowerCase?.().includes('already') || data?.message?.toLowerCase?.().includes('already'))
        return { alreadyPurchased: true };
      if (!res.ok)
        return { error: data?.message ?? data?.error ?? 'Erreur paiement' };
      return {
        authorizationUrl: data.authorization_url ?? data.paymentUrl ?? data.authorizationUrl,
        reference:        data.reference,
        alreadyPurchased: false,
      };
    } catch (e: any) {
      return { error: e?.message ?? 'Erreur réseau' };
    }
  },

  async verifierPaiement(reference: string): Promise<{
    success: boolean;
    status: 'success' | 'pending' | 'failed' | 'cancelled';
    livreId?: string;
  }> {
    try {
      const headers = await authHeaders();
      let res = await fetch(`${API()}/api/v1/library/pay/verify/${reference}`, { headers });
      if (res.status === 404)
        res = await fetch(`${API()}/api/v1/library/purchase/verify/${reference}`, { headers });
      const data = await res.json();
      const status = data.status ?? (data.success ? 'success' : 'pending');
      return {
        success: status === 'success' || data.success === true,
        status,
        livreId: data.livreId ?? data.bookId,
      };
    } catch {
      return { success: false, status: 'pending' };
    }
  },

  async telechargerPdf(livre: Livre): Promise<{ localUri?: string; error?: string }> {
    try {
      const token = await StorageService.get<string>(STORAGE_KEYS.AUTH_TOKEN);
      const downloadUrl = `${API()}/api/v1/library/${livre.id}/download`;

      if (typeof window !== 'undefined' && typeof document !== 'undefined') {
        const resp = await fetch(downloadUrl, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!resp.ok) {
          if (resp.status === 401 || resp.status === 403)
            return { error: "Accès refusé — veuillez acheter ce livre d'abord" };
          const err = await resp.json().catch(() => ({}));
          return { error: (err as any).message ?? `Erreur HTTP ${resp.status}` };
        }
        const blob = await resp.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${livre.title.replace(/[^a-z0-9]/gi, '_')}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        return { localUri: downloadUrl };
      }

      const FS = await import('expo-file-system/legacy');
      const dir = `${FS.documentDirectory}oracle_librairie/`;
      await FS.makeDirectoryAsync(dir, { intermediates: true });
      const localPath = `${dir}${livre.id}.pdf`;

      const info = await FS.getInfoAsync(localPath);
      if (info.exists && (info as any).size > 100) return { localUri: localPath };
      if (info.exists) await FS.deleteAsync(localPath, { idempotent: true });

      const result = await FS.downloadAsync(downloadUrl, localPath, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (result.status === 401 || result.status === 403)
        return { error: "Accès refusé — veuillez acheter ce livre d'abord" };
      if (result.status !== 200)
        return { error: `Téléchargement échoué (HTTP ${result.status})` };

      const dl = await FS.getInfoAsync(localPath);
      if (!dl.exists || (dl as any).size < 100) {
        await FS.deleteAsync(localPath, { idempotent: true });
        return { error: 'Fichier PDF invalide ou vide' };
      }
      return { localUri: localPath };
    } catch (e: any) {
      return { error: e?.message ?? 'Erreur téléchargement' };
    }
  },

  getReadUrl(livreId: string, token: string): string {
    return `${API()}/api/v1/library/${livreId}/download?token=${encodeURIComponent(token)}`;
  },

  // ── Admin ─────────────────────────────────────────────────────────────────

  async getAllAdmin(): Promise<Livre[]> {
    try {
      const headers = await authHeaders();
      let res = await fetch(`${API()}/api/v1/library/admin/books`, { headers });
      if (!res.ok) res = await fetch(`${API()}/api/v1/library?all=true`, { headers });
      if (!res.ok) return [];
      const data = await res.json();
      return (Array.isArray(data) ? data : []).map(normalizeBook);
    } catch { return []; }
  },

  async creerLivre(payload: Omit<Livre, 'id' | 'purchased' | 'purchasedAt' | 'purchaseCount' | 'downloadCount'>): Promise<Livre> {
    const headers = { ...(await authHeaders()), 'Content-Type': 'application/json' };
    const res = await fetch(`${API()}/api/v1/library`, {
      method: 'POST', headers,
      body: JSON.stringify({
        title:            payload.title,
        author:           payload.author,
        shortDescription: payload.shortDescription,
        description:      payload.description,
        category:         payload.category,
        coverUrl:         payload.coverUrl,
        pdfUrl:           payload.pdfUrl,
        tokenCost:        payload.priceFcfa,
        status:           payload.status ?? 'active',
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error((err as any).message ?? 'Erreur création');
    }
    return normalizeBook(await res.json());
  },

  async modifierLivre(id: string, payload: Partial<Omit<Livre, 'id' | 'purchased'>>): Promise<Livre> {
    const headers = { ...(await authHeaders()), 'Content-Type': 'application/json' };
    const body: any = {};
    if (payload.title            !== undefined) body.title            = payload.title;
    if (payload.author           !== undefined) body.author           = payload.author;
    if (payload.shortDescription !== undefined) body.shortDescription = payload.shortDescription;
    if (payload.description      !== undefined) body.description      = payload.description;
    if (payload.category         !== undefined) body.category         = payload.category;
    if (payload.coverUrl         !== undefined) body.coverUrl         = payload.coverUrl;
    if (payload.pdfUrl           !== undefined) body.pdfUrl           = payload.pdfUrl;
    if (payload.priceFcfa        !== undefined) body.tokenCost        = payload.priceFcfa;
    if (payload.status           !== undefined) body.status           = payload.status;
    const res = await fetch(`${API()}/api/v1/library/${id}`, {
      method: 'PATCH', headers, body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error((err as any).message ?? 'Erreur modification');
    }
    return normalizeBook(await res.json());
  },

  async supprimerLivre(id: string): Promise<void> {
    const headers = await authHeaders();
    const res = await fetch(`${API()}/api/v1/library/${id}`, { method: 'DELETE', headers });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error((err as any).message ?? 'Erreur suppression');
    }
  },

  async toggleStatut(id: string, status: 'active' | 'inactive'): Promise<void> {
    const headers = { ...(await authHeaders()), 'Content-Type': 'application/json' };
    await fetch(`${API()}/api/v1/library/${id}`, {
      method: 'PATCH', headers, body: JSON.stringify({ status }),
    });
  },

  async uploaderCouverture(fileUri: string, mimeType = 'image/jpeg'): Promise<string> {
    return LibrairieService._uploadFile('/library/upload/cover', fileUri, `cover_${Date.now()}.jpg`, mimeType);
  },

  async uploaderPdf(fileUri: string, fileName = 'book.pdf'): Promise<string> {
    return LibrairieService._uploadFile('/library/upload/pdf', fileUri, fileName, 'application/pdf');
  },

  async _uploadFile(endpoint: string, fileUri: string, fileName: string, mimeType: string): Promise<string> {
    const token = await StorageService.get<string>(STORAGE_KEYS.AUTH_TOKEN);
    const form = new FormData();

    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      const resp = await fetch(fileUri);
      const blob = await resp.blob();
      form.append('file', blob, fileName);
    } else {
      let uri = fileUri;
      if (fileUri.startsWith('content://') || fileUri.startsWith('ph://')) {
        const FS = await import('expo-file-system/legacy');
        const ext = fileName.split('.').pop() ?? 'bin';
        const dest = `${FS.cacheDirectory}upload_${Date.now()}.${ext}`;
        await FS.copyAsync({ from: fileUri, to: dest });
        uri = dest;
      }
      (form as any).append('file', { uri, name: fileName, type: mimeType });
    }

    const res = await fetch(`${API()}/api/v1${endpoint}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token ?? ''}`, Accept: 'application/json' },
      body: form,
    });

    const text = await res.text();
    let data: any;
    try { data = JSON.parse(text); } catch {
      throw new Error(`Réponse invalide du serveur: ${text.slice(0, 120)}`);
    }
    if (!res.ok || data.error) throw new Error(data.error ?? data.message ?? `Erreur upload HTTP ${res.status}`);
    if (!data.url) throw new Error('URL manquante dans la réponse du serveur');
    return data.url as string;
  },
};
