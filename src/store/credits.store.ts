/**
 * Credits store — Oracle Plus
 *
 * Règle de conversion (immuable) :
 *   1 FCFA = 1 crédit = 1 mot généré par l'API ChatGPT
 *
 * - 2000 crédits offerts à l'inscription (= 2000 FCFA de valeur)
 * - Abonnement actif → crédits NON consommés pour les services IA
 * - Abonnement actif → NE donne PAS accès à la librairie (achat séparé)
 * - Les packs de crédits s'achètent indépendamment de l'abonnement
 */
import { Platform } from 'react-native';
import { create } from 'zustand';
import { http } from '../services/http.client';
import { StorageService } from '../services/storage.service';

/** Notification push locale quand les crédits tombent à 0 */
async function sendLowCreditsNotification() {
  const title = '⚡ Oracle Plus — Crédits épuisés';
  const body  = 'Vos crédits sont épuisés. Rechargez ou abonnez-vous pour continuer à recevoir vos guidances spirituelles.';
  try {
    if (Platform.OS !== 'web') {
      const Notifs = await import('expo-notifications');
      await Notifs.scheduleNotificationAsync({
        content: {
          title,
          body,
          sound: true,
          data: { url: '/subscription' },
          priority: Notifs.AndroidNotificationPriority?.HIGH,
          ...(Platform.OS === 'android' ? { channelId: 'oracle-default' } : {}),
        },
        trigger: null,
      });
    } else if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      const options: NotificationOptions = {
        body,
        icon: '/icon-192.png',
        badge: '/favicon.png',
        tag: 'low-credits',
        requireInteraction: true,
        vibrate: [200, 100, 200],
        data: { url: '/subscription' },
        actions: [
          { action: 'recharge', title: 'Recharger maintenant' },
          { action: 'subscribe', title: "S'abonner" },
        ],
      } as any;
      if ('serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.ready;
        await reg.showNotification(title, options);
      } else {
        new Notification(title, options);
      }
    }
  } catch {
    // Silencieux
  }
}

const CREDITS_KEY = '@oracle/credits';
const ADS_KEY = '@oracle/ads_today';
export const INITIAL_CREDITS = 2000;

export const CREDIT_COSTS = {
  ai_chat:                 50,
  accompagnement:          50,
  dream_interpretation:    80,
  prophetic_consultation: 100,
  prayer_generation:       20,
  audio_preview:           10,
  audio_full:              50,
} as const;

export type CreditAction = keyof typeof CREDIT_COSTS;

// 1 FCFA = 1 crédit — les prix et crédits sont toujours identiques
export const CREDIT_PACKS = [
  { id: 'starter',  label: 'Pack Départ',   credits: 500,  price: 500,  priceLabel: '500 FCFA' },
  { id: 'standard', label: 'Pack Standard', credits: 2000, price: 1000, priceLabel: '1 000 FCFA', badge: '⭐ Populaire' },
  { id: 'premium',  label: 'Pack Premium',  credits: 5000, price: 2500, priceLabel: '2 500 FCFA', badge: '🏆 Meilleure valeur' },
] as const;

export type CreditPackId = typeof CREDIT_PACKS[number]['id'];

interface CreditsState {
  credits: number;
  adsAvailable: number;
  isLoading: boolean;
  init: () => Promise<void>;
  fetchBalance: () => Promise<void>;
  spend: (action: CreditAction) => Promise<boolean>;
  /** Deduct exactly `wordCount` credits (1 credit = 1 word). Returns false if insufficient. */
  spendWords: (wordCount: number) => Promise<boolean>;
  adReward: () => Promise<void>;
  purchase: (packId: CreditPackId | string, reference: string) => Promise<void>;
  canAfford: (action: CreditAction) => boolean;
  setCredits: (n: number) => void;
}

export const useCreditsStore = create<CreditsState>((set, get) => ({
  credits: INITIAL_CREDITS,
  adsAvailable: 3,
  isLoading: false,

  init: async () => {
    const cached = await StorageService.get<number>(CREDITS_KEY);
    if (cached !== null) set({ credits: cached });
    await get().fetchBalance();
  },

  fetchBalance: async () => {
    try {
      // Essayer /credits d'abord, puis /credits/me, puis /users/me
      let res = await http.get<any>('/credits').catch(() => null);
      if (!res?.credits && res?.credits !== 0) {
        res = await http.get<any>('/credits/me').catch(() => null);
      }
      if (!res?.credits && res?.credits !== 0) {
        const user = await http.get<any>('/users/me').catch(() => null);
        if (user?.credits !== undefined) res = { credits: user.credits };
      }
      if (res?.credits !== undefined) {
        set({ credits: res.credits, adsAvailable: res.adsAvailable ?? res.adsRemaining ?? 3 });
        await StorageService.set(CREDITS_KEY, res.credits);
      }
    } catch { /* offline — keep local cache */ }
  },

  spend: async (action: CreditAction): Promise<boolean> => {
    const cost = CREDIT_COSTS[action];
    if (get().credits < cost) return false;
    // Déduire localement immédiatement pour une UX réactive
    const optimistic = get().credits - cost;
    set({ credits: optimistic });
    await StorageService.set(CREDITS_KEY, optimistic);
    try {
      const res = await http.post<{ credits: number }>('/credits/deduct', { amount: cost, action });
      if (res?.credits !== undefined) {
        set({ credits: res.credits });
        await StorageService.set(CREDITS_KEY, res.credits);
      }
    } catch { /* déjà déduit localement */ }
    return true;
  },

  spendWords: async (wordCount: number): Promise<boolean> => {
    if (wordCount <= 0) return true;
    if (get().credits < wordCount) return false;
    const optimistic = get().credits - wordCount;
    set({ credits: optimistic });
    await StorageService.set(CREDITS_KEY, optimistic);
    try {
      const res = await http.post<{ credits: number }>('/credits/deduct', { amount: wordCount, action: 'word_generation' });
      if (res?.credits !== undefined) {
        set({ credits: res.credits });
        await StorageService.set(CREDITS_KEY, res.credits);
      }
    } catch {}
    if (get().credits <= 0) sendLowCreditsNotification();
    return true;
  },

  adReward: async () => {
    try {
      const res = await http.post<{ credits: number; adsRemaining?: number }>('/credits/add', { amount: 100 });
      if (res?.credits !== undefined) {
        set({ credits: res.credits, adsAvailable: res.adsRemaining ?? Math.max(0, get().adsAvailable - 1) });
        await StorageService.set(CREDITS_KEY, res.credits);
        return;
      }
    } catch {}
    // Fallback local si le backend ne répond pas
    const next = get().credits + 100;
    const ads = Math.max(0, get().adsAvailable - 1);
    set({ credits: next, adsAvailable: ads });
    await StorageService.set(CREDITS_KEY, next);
  },

  purchase: async (packId, reference) => {
    // Le backend confirme le paiement via /subscriptions/verify/{ref}
    // (même route pour abonnements et crédits — le backend distingue via le plan)
    // On ne fait que resynchroniser le solde après confirmation.
    try {
      await http.get<any>(`/subscriptions/verify/${reference}`);
    } catch {
      // Ignorer l'erreur : le polling dans payment.tsx a déjà vérifié
    }
    // Resynchroniser le solde depuis le backend (source de vérité)
    await get().fetchBalance();
  },

  canAfford: (action: CreditAction): boolean => get().credits >= CREDIT_COSTS[action],

  setCredits: (n: number) => set({ credits: n }),
}));
