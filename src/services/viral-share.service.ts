/**
 * Viral Share Service — Partage WhatsApp pour 1000 crédits
 *
 * Flux :
 * 1. L'utilisateur appuie sur "Partager sur WhatsApp" → ouvre WhatsApp avec le message
 * 2. Après le partage, il revient et appuie sur "J'ai partagé à 50 contacts"
 * 3. Le backend enregistre la demande (status: pending) — max 2 par jour
 * 4. Un admin valide manuellement → 1000 crédits crédités
 */
import { Platform, Share } from 'react-native';
import { http } from './http.client';
import { StorageService } from './storage.service';

const KEY_SHARE_COUNT = '@oracle/viral_share_today';
const KEY_SHARE_DATE  = '@oracle/viral_share_date';
const MAX_PER_DAY     = 2;

export interface ViralShareRequest {
  id: string;
  userId: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  creditsAwarded: number;
}

export const ViralShareService = {
  /** Nombre de demandes soumises aujourd'hui (max 2) */
  async getTodayCount(): Promise<number> {
    const today = new Date().toISOString().split('T')[0];
    const date  = await StorageService.get<string>(KEY_SHARE_DATE);
    if (date !== today) return 0;
    return (await StorageService.get<number>(KEY_SHARE_COUNT)) ?? 0;
  },

  async canSubmitToday(): Promise<boolean> {
    return (await ViralShareService.getTodayCount()) < MAX_PER_DAY;
  },

  /** Ouvre WhatsApp avec le message de partage */
  async openWhatsApp(): Promise<void> {
    const appUrl = (typeof window !== 'undefined' && (window as any).__ENV__?.EXPO_PUBLIC_APP_URL)
      || process.env.EXPO_PUBLIC_APP_URL
      || 'https://oracle-plus.online';

    const message = encodeURIComponent(
      `🔮 *Oracle Plus* — Guidance spirituelle africaine\n\n` +
      `Découvrez l'interprétation des rêves, la voyance et la prière guidée.\n\n` +
      `👉 ${appUrl}\n\n` +
      `Inscrivez-vous et recevez *2000 crédits gratuits* !`
    );

    const waUrl = `https://wa.me/?text=${message}`;

    if (Platform.OS === 'web') {
      window.open(waUrl, '_blank');
    } else {
      try {
        await Share.share({ message: decodeURIComponent(message), url: appUrl });
      } catch {}
    }
  },

  /** Soumettre une demande de validation après partage */
  async submitShareRequest(): Promise<{ success: boolean; message: string; request?: ViralShareRequest }> {
    const canSubmit = await ViralShareService.canSubmitToday();
    if (!canSubmit) {
      return { success: false, message: `Limite atteinte : ${MAX_PER_DAY} demandes par jour maximum.` };
    }

    try {
      const result = await http.post<ViralShareRequest>('/viral-shares', {
        contactsCount: 50,
      });

      // Incrémenter le compteur local
      const today = new Date().toISOString().split('T')[0];
      const count = await ViralShareService.getTodayCount();
      await StorageService.set(KEY_SHARE_DATE, today);
      await StorageService.set(KEY_SHARE_COUNT, count + 1);

      return { success: true, message: 'Demande envoyée ! Un admin validera sous 24h.', request: result };
    } catch (e: any) {
      return { success: false, message: e?.message ?? 'Erreur lors de la soumission.' };
    }
  },

  /** Historique des demandes de l'utilisateur */
  async getMyRequests(): Promise<ViralShareRequest[]> {
    try {
      return await http.get<ViralShareRequest[]>('/viral-shares/me');
    } catch {
      return [];
    }
  },

  /** [Admin] Lister toutes les demandes en attente */
  async adminGetPending(): Promise<(ViralShareRequest & { user: { name: string; email: string } })[]> {
    try {
      return await http.get('/viral-shares/admin/pending');
    } catch {
      return [];
    }
  },

  /** [Admin] Approuver une demande → crédite 1000 crédits */
  async adminApprove(id: string): Promise<boolean> {
    try {
      await http.post(`/viral-shares/admin/${id}/approve`, {});
      return true;
    } catch {
      return false;
    }
  },

  /** [Admin] Rejeter une demande */
  async adminReject(id: string): Promise<boolean> {
    try {
      await http.post(`/viral-shares/admin/${id}/reject`, {});
      return true;
    } catch {
      return false;
    }
  },

  /** [Admin] Statistiques globales */
  async adminGetStats(): Promise<{ pending: number; approved: number; rejected: number; totalCreditsAwarded: number }> {
    try {
      return await http.get('/viral-shares/admin/stats');
    } catch {
      return { pending: 0, approved: 0, rejected: 0, totalCreditsAwarded: 0 };
    }
  },
};
