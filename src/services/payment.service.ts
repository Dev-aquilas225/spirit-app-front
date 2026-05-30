/**
 * Payment Service — Oracle Plus (Paystack via API backend)
 */
import { http, ApiError } from './http.client';

export type SubscriptionPlan = 'weekly_plus' | 'monthly';
export type SubscriptionStatus = 'active' | 'expired' | 'cancelled' | 'pending';
export type PaymentMethod = 'card' | 'mobile_money' | 'orange_money' | 'mtn_money';

export interface SubscriptionPlanInfo {
  id: string;
  name: string;
  price: number;
  currency: string;
  durationDays: number;
  features: string[];
}

export interface Subscription {
  id: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  startDate: string;
  expiryDate: string;
  autoRenew: boolean;
  amount: number;
  currency: 'FCFA';
}

export interface PaymentRecord {
  id: string;
  userId: string;
  amount: number;
  currency: 'FCFA';
  method: PaymentMethod;
  status: 'pending' | 'success' | 'failed';
  reference: string;
  createdAt: string;
  description: string;
}

export interface AdminSubscription {
  id: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  amount: number;
  currency: string;
  startDate: string | null;
  endDate: string | null;
  paymentReference: string | null;
  paymentProvider: string | null;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
    phone: string | null;
  };
}

export interface InitiateResult {
  subscriptionId: string;
  reference: string;
  authorization_url: string;
  access_code: string;
  amount: number;
  currency: string;
  plan: SubscriptionPlan;
}

// Static plan definitions (prices in FCFA)
export const SUBSCRIPTION_PLANS: {
  id: SubscriptionPlan;
  name: string;
  price: number;
  priceLabel: string;
  durationDays: number;
  badge?: string;
  features: string[];
}[] = [
  {
    id: 'weekly_plus',
    name: 'Offre Hebdomadaire',
    price: 3000,
    priceLabel: '3 000 FCFA',
    durationDays: 7,
    badge: '⭐ Populaire',
    features: ['Accès illimité 7 jours', 'Voyance & rêves illimités', 'Audio illimité', 'Réponses prioritaires'],
  },
  {
    id: 'monthly',
    name: 'Offre Mensuelle',
    price: 8000,
    priceLabel: '8 000 FCFA',
    durationDays: 30,
    badge: '🏆 Meilleure valeur',
    features: ['Accès illimité 30 jours', 'Toutes les fonctionnalités', 'Audio illimité', 'Priorité maximale', 'Historique complet'],
  },
];

export const PaymentService = {
  async getPlans(): Promise<SubscriptionPlanInfo[]> {
    try {
      return await http.get<SubscriptionPlanInfo[]>('/subscriptions/plans');
    } catch {
      return [];
    }
  },

  async getMySubscription(): Promise<Subscription | null> {
    try {
      // Le backend retourne { isActive: boolean, subscription: {...} | null }
      const result = await http.get<{ isActive: boolean; subscription: any }>('/subscriptions/me');
      const sub = result?.subscription;
      if (!sub?.id) return null;
      return {
        id: sub.id,
        plan: sub.plan ?? 'monthly',
        status: sub.status ?? 'active',
        startDate: sub.startDate ?? new Date().toISOString(),
        // Le backend utilise "endDate", le frontend "expiryDate"
        expiryDate: sub.endDate ?? sub.expiryDate ?? new Date().toISOString(),
        autoRenew: sub.autoRenew ?? false,
        amount: sub.amount ?? (sub.plan === "weekly_plus" ? 3000 : 8000),
        currency: 'FCFA',
      };
    } catch {
      return null;
    }
  },

  async getPaymentHistory(): Promise<PaymentRecord[]> {
    // Fetch subscription payments and credit purchases in parallel, merge by date desc
    const [subRaw, creditRaw] = await Promise.allSettled([
      http.get<any>('/subscriptions/me/history'),
      http.get<any>('/credits/history'),
    ]);

    function normalizeItems(raw: any, defaultDesc: (item: any) => string): PaymentRecord[] {
      const arr: any[] = Array.isArray(raw)
        ? raw
        : Array.isArray(raw?.data) ? raw.data
        : Array.isArray(raw?.payments) ? raw.payments
        : Array.isArray(raw?.transactions) ? raw.transactions
        : [];
      return arr.map((item: any) => ({
        id: item.id ?? `${item.reference ?? 'payment'}-${item.createdAt ?? Date.now()}`,
        userId: item.userId ?? '',
        amount: item.amount ?? 0,
        currency: 'FCFA' as const,
        method: (item.method as PaymentMethod) ?? 'card',
        status: (item.status === 'success' || item.status === 'failed' || item.status === 'pending')
          ? item.status : 'pending',
        reference: item.reference ?? item.paymentReference ?? '',
        createdAt: item.createdAt ?? item.updatedAt ?? new Date().toISOString(),
        description: item.description ?? defaultDesc(item),
      }));
    }

    const subItems = subRaw.status === 'fulfilled'
      ? normalizeItems(subRaw.value, (i) => i.plan ? `Abonnement ${i.plan}` : 'Abonnement Oracle Plus')
      : [];

    const creditItems = creditRaw.status === 'fulfilled'
      ? normalizeItems(creditRaw.value, (i) => i.packId ? `Recharge crédits — ${i.packId}` : 'Achat de crédits')
      : [];

    // Achats de livres
    let bookItems: PaymentRecord[] = [];
    try {
      const bookRaw = await http.get<any>('/library/purchases');
      bookItems = normalizeItems(bookRaw, (i) => i.title ? `Livre — ${i.title}` : 'Achat de livre');
    } catch {}

    // Merge and sort by date descending
    return [...subItems, ...creditItems, ...bookItems].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  },

  /**
   * Initier un paiement Paystack.
   * Retourne l'URL de paiement vers laquelle rediriger l'utilisateur.
   */
  async initiate(plan: string, autoRenew = false): Promise<{ data?: InitiateResult; error?: string }> {
    // Plans abonnement : 'weekly_plus' | 'monthly' | 'yearly'
    // Plans crédits    : 'starter' (500 cr) | 'standard' (2000 cr) | 'premium' (5000 cr)
    // Le backend distingue les deux types via le champ 'plan' et crédite en conséquence.
    try {
      const result = await http.post<any>('/subscriptions/initiate', { plan, autoRenew });
      // Backend retourne paymentUrl, frontend attend authorization_url
      const normalized: InitiateResult = {
        reference: result.reference ?? '',
        authorization_url: result.authorization_url ?? result.paymentUrl ?? '',
        subscriptionId: result.subscriptionId ?? '',
        access_code: result.access_code ?? '',
        amount: result.amount ?? 0,
        currency: result.currency ?? 'FCFA',
        plan: result.plan ?? 'monthly',
      };
      return { data: normalized };
    } catch (e) {
      return { error: (e as ApiError).message };
    }
  },

  /**
   * Vérifier le paiement après retour de la page Paystack.
   */
  async verifyPayment(reference: string): Promise<{ success: boolean; subscription?: Subscription; error?: string }> {
    try {
      const data = await http.get<any>(`/subscriptions/verify/${reference}`);
      return { success: true, subscription: data.subscription ?? data };
    } catch (e) {
      return { success: false, error: (e as ApiError).message };
    }
  },

  /**
   * Polling : vérifie le statut d'un paiement par sa référence.
   * Appelé toutes les 4 secondes par payment.tsx jusqu'à active|failed.
   */
  async getStatus(reference: string): Promise<{
    status: 'pending' | 'active' | 'success' | 'failed' | 'cancelled' | 'expired';
    subscription?: Subscription;
  }> {
    try {
      return await http.get(`/subscriptions/status/${reference}`);
    } catch {
      return { status: 'pending' }; // réseau → on réessaie au prochain tick
    }
  },

  // ─── Admin ─────────────────────────────────────────────────────────────

  async adminGetAll(): Promise<AdminSubscription[]> {
    try {
      return await http.get<AdminSubscription[]>('/subscriptions/admin/all');
    } catch {
      return [];
    }
  },

  async adminActivate(subscriptionId: string): Promise<{ success: boolean; error?: string }> {
    try {
      await http.post(`/subscriptions/admin/activate/${subscriptionId}`, {});
      return { success: true };
    } catch (e) {
      return { success: false, error: (e as ApiError).message };
    }
  },

  async cancel(): Promise<{ error?: string }> {
    try {
      await http.delete('/subscriptions/me/cancel');
      return {};
    } catch (e) {
      return { error: (e as ApiError).message };
    }
  },
};
