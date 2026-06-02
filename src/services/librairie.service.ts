/**
 * Librairie Service — Oracle Plus
 *
 * Règles métier :
 * - Chaque livre a un prix en FCFA (= crédits, 1 FCFA = 1 crédit).
 * - Le paiement appelle directement l'API Paystack (pas de dépendance
 *   aux autres services de l'app).
 * - L'abonnement actif NE donne PAS accès aux livres — tout le monde
 *   doit payer avec ses crédits.
 * - Après paiement validé, le PDF est téléchargeable.
 */
import { StorageService } from './storage.service';
import { STORAGE_KEYS } from '../utils/constants';

const API = () =>
  (process.env.EXPO_PUBLIC_API_BASE_URL ?? 'https://api.oracle-plus.online').replace(/\/$/, '');

export interface Livre {
  id: string;
  title: string;
  author?: string;
  description?: string;
  category?: string;
  coverUrl?: string;
  pdfUrl?: string;
  priceFcfa: number;       // prix en FCFA (= crédits)
  status: 'active' | 'inactive';
  purchased?: boolean;     // true si l'utilisateur a déjà acheté ce livre
}

export interface LivreAchat {
  livreId: string;
  reference: string;
  paidAt: string;
}

// ── Clé de cache local des achats ────────────────────────────────────────────
const ACHATS_KEY = '@oracle/librairie_achats';

export const LibrairieService = {

  // ── Liste tous les livres actifs ──────────────────────────────────────────
  async getAll(category?: string): Promise<Livre[]> {
    try {
      const token = await StorageService.get<string>(STORAGE_KEYS.AUTH_TOKEN);
      const url = category
        ? `${API()}/api/v1/library?category=${encodeURIComponent(category)}`
        : `${API()}/api/v1/library`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token ?? ''}` },
      });
      if (!res.ok) return [];
      const data = await res.json();
      const list: any[] = Array.isArray(data) ? data : [];
      // Normaliser priceFcfa depuis tokenCost (backend) ou price
      return list.map((b) => ({
        id:          b.id,
        title:       b.title ?? '',
        author:      b.author,
        description: b.description,
        category:    b.category,
        coverUrl:    b.coverUrl,
        pdfUrl:      b.pdfUrl,
        priceFcfa:   b.tokenCost ?? b.priceFcfa ?? 0,
        status:      b.status ?? 'active',
        purchased:   b.purchased ?? false,
      }));
    } catch { return []; }
  },

  // ── Initier un paiement Paystack pour un livre ────────────────────────────
  // Appel direct à l'API Paystack via le backend (POST /library/:id/pay)
  async initierPaiement(livreId: string): Promise<{
    authorizationUrl?: string;
    reference?: string;
    error?: string;
  }> {
    try {
      const token = await StorageService.get<string>(STORAGE_KEYS.AUTH_TOKEN);
      const res = await fetch(`${API()}/api/v1/library/${livreId}/pay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token ?? ''}`,
        },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok) return { error: data?.message ?? 'Erreur paiement' };
      return {
        authorizationUrl: data.authorization_url ?? data.paymentUrl,
        reference:        data.reference,
      };
    } catch (e: any) {
      return { error: e?.message ?? 'Erreur réseau' };
    }
  },

  // ── Vérifier le statut d'un paiement ─────────────────────────────────────
  async verifierPaiement(reference: string): Promise<{
    status: 'success' | 'pending' | 'failed' | 'cancelled';
    livreId?: string;
  }> {
    try {
      const token = await StorageService.get<string>(STORAGE_KEYS.AUTH_TOKEN);
      const res = await fetch(`${API()}/api/v1/library/pay/verify/${reference}`, {
        headers: { Authorization: `Bearer ${token ?? ''}` },
      });
      const data = await res.json();
      return {
        status:  data.status ?? 'pending',
        livreId: data.livreId ?? data.bookId,
      };
    } catch {
      return { status: 'pending' };
    }
  },

  // ── Télécharger le PDF (web : blob, natif : fichier local) ────────────────
  async telechargerPdf(livre: Livre): Promise<{ localUri?: string; error?: string }> {
    try {
      if (!livre.pdfUrl && !livre.id) return { error: 'Aucun PDF disponible' };
      const token = await StorageService.get<string>(STORAGE_KEYS.AUTH_TOKEN);
      const downloadUrl = `${API()}/api/v1/library/${livre.id}/download`;

      if (typeof window !== 'undefined' && typeof document !== 'undefined') {
        // Web
        const resp = await fetch(downloadUrl, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!resp.ok) {
          const err = await resp.json().catch(() => ({}));
          if (resp.status === 401 || resp.status === 403)
            return { error: 'Accès refusé — veuillez acheter ce livre d\'abord' };
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

      // Natif
      const FS = await import('expo-file-system/legacy');
      const dir = `${FS.documentDirectory}oracle_librairie/`;
      await FS.makeDirectoryAsync(dir, { intermediates: true });
      const localPath = `${dir}${livre.id}.pdf`;

      // Vérifier cache valide (> 1 Ko)
      const info = await FS.getInfoAsync(localPath);
      if (info.exists && (info as any).size > 1024) return { localUri: localPath };
      if (info.exists) await FS.deleteAsync(localPath, { idempotent: true });

      const result = await FS.downloadAsync(downloadUrl, localPath, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (result.status === 401 || result.status === 403)
        return { error: 'Accès refusé — veuillez acheter ce livre d\'abord' };
      if (result.status !== 200)
        return { error: `Téléchargement échoué (HTTP ${result.status})` };

      const dl = await FS.getInfoAsync(localPath);
      if (!dl.exists || (dl as any).size < 1024) {
        await FS.deleteAsync(localPath, { idempotent: true });
        return { error: 'Fichier PDF invalide ou vide' };
      }
      return { localUri: localPath };
    } catch (e: any) {
      return { error: e?.message ?? 'Erreur téléchargement' };
    }
  },

  // ── Sauvegarder un achat localement (cache) ───────────────────────────────
  async sauvegarderAchat(livreId: string, reference: string): Promise<void> {
    const existing = await StorageService.get<LivreAchat[]>(ACHATS_KEY) ?? [];
    if (existing.some((a) => a.livreId === livreId)) return;
    await StorageService.set(ACHATS_KEY, [
      ...existing,
      { livreId, reference, paidAt: new Date().toISOString() },
    ]);
  },

  async estAchete(livreId: string): Promise<boolean> {
    const list = await StorageService.get<LivreAchat[]>(ACHATS_KEY) ?? [];
    return list.some((a) => a.livreId === livreId);
  },

  // ── Admin : créer un livre ────────────────────────────────────────────────
  async creerLivre(payload: Omit<Livre, 'id' | 'purchased'>): Promise<Livre> {
    const token = await StorageService.get<string>(STORAGE_KEYS.AUTH_TOKEN);
    const res = await fetch(`${API()}/api/v1/library`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token ?? ''}`,
      },
      body: JSON.stringify({
        title:       payload.title,
        author:      payload.author,
        description: payload.description,
        category:    payload.category,
        coverUrl:    payload.coverUrl,
        pdfUrl:      payload.pdfUrl,
        tokenCost:   payload.priceFcfa,
        status:      payload.status ?? 'active',
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error((err as any).message ?? 'Erreur création');
    }
    return res.json();
  },

  // ── Admin : modifier un livre ─────────────────────────────────────────────
  async modifierLivre(id: string, payload: Partial<Omit<Livre, 'id' | 'purchased'>>): Promise<Livre> {
    const token = await StorageService.get<string>(STORAGE_KEYS.AUTH_TOKEN);
    const res = await fetch(`${API()}/api/v1/library/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token ?? ''}`,
      },
      body: JSON.stringify({
        title:       payload.title,
        author:      payload.author,
        description: payload.description,
        category:    payload.category,
        coverUrl:    payload.coverUrl,
        pdfUrl:      payload.pdfUrl,
        tokenCost:   payload.priceFcfa,
        status:      payload.status,
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error((err as any).message ?? 'Erreur modification');
    }
    return res.json();
  },

  // ── Admin : uploader une couverture ──────────────────────────────────────
  async uploaderCouverture(fileUri: string, mimeType = 'image/jpeg'): Promise<string> {
    const token = await StorageService.get<string>(STORAGE_KEYS.AUTH_TOKEN);
    const form = new FormData();

    if (typeof window !== 'undefined') {
      // Web : fileUri est une data URL ou object URL — récupérer le blob
      const resp = await fetch(fileUri);
      const blob = await resp.blob();
      form.append('file', blob, 'cover.jpg');
    } else {
      // Natif
      const { Platform } = await import('react-native');
      let uri = fileUri;
      if (Platform.OS !== 'web' && (fileUri.startsWith('content://') || fileUri.startsWith('ph://'))) {
        const FS = await import('expo-file-system/legacy');
        const ext = mimeType.split('/')[1] ?? 'jpg';
        const dest = `${FS.cacheDirectory}cover_${Date.now()}.${ext}`;
        await FS.copyAsync({ from: fileUri, to: dest });
        uri = dest;
      }
      (form as any).append('file', { uri, name: 'cover.jpg', type: mimeType });
    }

    const res = await fetch(`${API()}/api/v1/library/upload/cover`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token ?? ''}` },
      body: form,
    });
    const data = await res.json();
    if (!data.url) throw new Error(data.error ?? 'Upload couverture échoué');
    return data.url;
  },

  // ── Admin : uploader un PDF ───────────────────────────────────────────────
  async uploaderPdf(fileUri: string): Promise<string> {
    const token = await StorageService.get<string>(STORAGE_KEYS.AUTH_TOKEN);
    const form = new FormData();

    if (typeof window !== 'undefined') {
      const resp = await fetch(fileUri);
      const blob = await resp.blob();
      form.append('file', blob, 'book.pdf');
    } else {
      const { Platform } = await import('react-native');
      let uri = fileUri;
      if (Platform.OS !== 'web' && fileUri.startsWith('content://')) {
        const FS = await import('expo-file-system/legacy');
        const dest = `${FS.cacheDirectory}pdf_${Date.now()}.pdf`;
        await FS.copyAsync({ from: fileUri, to: dest });
        uri = dest;
      }
      (form as any).append('file', { uri, name: 'book.pdf', type: 'application/pdf' });
    }

    const res = await fetch(`${API()}/api/v1/library/upload/pdf`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token ?? ''}` },
      body: form,
    });
    const data = await res.json();
    if (!data.url) throw new Error(data.error ?? 'Upload PDF échoué');
    return data.url;
  },
};
