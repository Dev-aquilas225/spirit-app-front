/**
 * Payment Service — Oracle Plus (Paystack via API backend)
 *
 * Routes backend réelles :
 *  POST /subscriptions/initiate  → { reference, authorization_url, access_code, subscriptionId, amount, currency, plan }
 *  GET  /subscriptions/verify/:ref → { success, verified, subscription }
 *  GET  /subscriptions/status/:ref → { status: 'pending'|'active'|'failed'|'cancelled', subscription? }
 *  GET  /subscriptions/me         → { isActive, subscription }
 *  GET  /subscriptions/me/history → SubscriptionsEntity[]
 *  GET  /subscriptions/plans      → tous les plans (abonnements + crédits)
 *  GET  /credits/me               → { credits }
 *  POST /credits/deduct           → { success, credits }
 *  POST /credits/add              → { success, credits }
 */
import { http, ApiError } from './http.client';

export type SubscriptionPlan = 'weekly_plus' | 'monthly' | 'yearly';
export type CreditPackId     = 'starter' | 'standard' | 'premium';
export type SubscriptionStatus = 'active' | 'expired' | 'cancelled' | 'pending' | 'failed';
export type PaymentMethod = 'card' | 'mobile_money' | 'orange_money' | 'mtn_money';

export interface SubscriptionPlanInfo {
  id: string;
  name: string;
  price: number;
  currency: string;
  durationDays?: number;
  credits: number;
}

export interface Subscription {
  id: string;
  plan: string;
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
  plan: string;
  status: SubscriptionStatus;
  amount: number;
  currency: string;
  expiresAt: string | null;
  reference: string | null;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
  };
}

export interface InitiateResult {
  subscriptionId: string;
  reference: string;
  authorization_url: string;
  access_code: string;
  amount: number;
  currency: string;
  plan: string;
}

// Plans statiques (affichage UI — source de vérité = backend /subscriptions/plans)
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

const CREDIT_PACK_IDS = ['starter', 'standard', 'premium'];

/** Normalise une entité subscription brute du backend en objet Subscription frontend */
function normalizeSubscription(sub: any): Subscription {
  return {
    id:         sub.id,
    plan:       sub.plan ?? 'monthly',
    status:     sub.status ?? 'pending',
    startDate:  sub.createdAt ?? new Date().toISOString(),
    // Le backend stocke la date d'expiration dans `expiresAt`
    expiryDate: sub.expiresAt ?? sub.endDate ?? sub.expiryDate ?? new Date().toISOString(),
    autoRenew:  sub.autoRenew ?? false,
    amount:     sub.amount ?? 0,
    currency:   'FCFA',
  };
}

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
      const result = await http.get<{ isActive: boolean; subscription: any }>('/subscriptions/me');
      const sub = result?.subscription;
      if (!sub?.id) return null;
      return normalizeSubscription(sub);
    } catch {
      return null;
    }
  },

  async getPaymentHistory(): Promise<PaymentRecord[]> {
    const PLAN_LABELS: Record<string, string> = {
      starter:     'Pack Départ (500 crédits)',
      standard:    'Pack Standard (1 000 crédits)',
      premium:     'Pack Premium (2 500 crédits)',
      weekly_plus: 'Abonnement Hebdomadaire',
      monthly:     'Abonnement Mensuel',
      yearly:      'Abonnement Annuel',
    };
    const PLAN_AMOUNTS: Record<string, number> = {
      starter: 500, standard: 1000, premium: 2500,
      weekly_plus: 3000, monthly: 8000, yearly: 15000,
    };

    function normalizeItems(raw: any): PaymentRecord[] {
      const arr: any[] = Array.isArray(raw) ? raw
        : Array.isArray(raw?.data) ? raw.data
        : Array.isArray(raw?.payments) ? raw.payments
        : [];
      return arr.map((item: any) => {
        const rawStatus = item.status ?? 'pending';
        const status: 'success' | 'failed' | 'pending' =
          rawStatus === 'success' || rawStatus === 'active' || rawStatus === 'completed'
            ? 'success'
            : rawStatus === 'failed' || rawStatus === 'cancelled' || rawStatus === 'expired'
            ? 'failed'
            : 'pending';
        const plan = item.plan ?? '';
        return {
          id:          item.id ?? `${item.reference ?? 'pay'}-${Date.now()}`,
          userId:      item.userId ?? '',
          amount:      item.amount ?? PLAN_AMOUNTS[plan] ?? 0,
          currency:    'FCFA' as const,
          method:      (item.method as PaymentMethod) ?? 'card',
          status,
          reference:   item.reference ?? item.paystackRef ?? '',
          createdAt:   item.createdAt ?? item.updatedAt ?? new Date().toISOString(),
          description: item.description ?? PLAN_LABELS[plan] ?? (plan ? `Plan ${plan}` : 'Paiement Oracle Plus'),
        };
      });
    }

    const [subRaw, bookRaw] = await Promise.allSettled([
      http.get<any>('/subscriptions/me/history'),
      http.get<any>('/library/purchases'),
    ]);

    const subItems  = subRaw.status  === 'fulfilled' ? normalizeItems(subRaw.value)  : [];
    const bookItems = bookRaw.status === 'fulfilled' ? normalizeItems(bookRaw.value) : [];

    return [...subItems, ...bookItems].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  },

  /**
   * Initier un paiement Paystack (abonnement ou pack crédits).
   * Le backend distingue les deux via le champ `plan`.
   */
  async initiate(plan: string, autoRenew = false): Promise<{ data?: InitiateResult; error?: string }> {
    try {
      const result = await http.post<any>('/subscriptions/initiate', {
        plan,
        autoRenew: CREDIT_PACK_IDS.includes(plan) ? false : autoRenew,
      });

      const normalized: InitiateResult = {
        reference:         result.reference ?? '',
        // Le backend retourne authorization_url (après notre fix)
        authorization_url: result.authorization_url ?? result.paymentUrl ?? result.checkoutUrl ?? '',
        subscriptionId:    result.subscriptionId ?? '',
        access_code:       result.access_code ?? '',
        amount:            result.amount ?? 0,
        currency:          result.currency ?? 'XOF',
        plan:              result.plan ?? plan,
      };
      return { data: normalized };
    } catch (e) {
      return { error: (e as ApiError).message };
    }
  },

  /**
   * Vérifier un paiement (abonnement ou crédits).
   * Le backend retourne { success, verified, subscription }.
   */
  async verifyPayment(reference: string): Promise<{ success: boolean; subscription?: Subscription; error?: string }> {
    try {
      const data = await http.get<any>(`/subscriptions/verify/${reference}`);
      // Le backend retourne `success` ET `verified` (les deux sont vrais si OK)
      const ok = data?.success === true || data?.verified === true;
      return {
        success: ok,
        subscription: data?.subscription ? normalizeSubscription(data.subscription) : undefined,
      };
    } catch (e) {
      return { success: false, error: (e as ApiError).message };
    }
  },

  /**
   * Vérifier un paiement de pack crédits.
   * Même route que verifyPayment — le backend gère les deux.
   */
  async verifyCreditPayment(reference: string): Promise<{ success: boolean; credits?: number; error?: string }> {
    try {
      const data = await http.get<any>(`/subscriptions/verify/${reference}`);
      const ok = data?.success === true || data?.verified === true;
      return {
        success: ok,
        credits: data?.credits ?? data?.balance,
      };
    } catch (e) {
      return { success: false, error: (e as ApiError).message };
    }
  },

  /**
   * Polling : statut d'un paiement par référence.
   * Le backend retourne { status: 'pending'|'active'|'failed'|'cancelled', subscription? }.
   */
  async getStatus(reference: string): Promise<{
    status: 'pending' | 'active' | 'success' | 'failed' | 'cancelled' | 'expired';
    subscription?: Subscription;
  }> {
    try {
      const data = await http.get<any>(`/subscriptions/status/${reference}`);
      // Normaliser : le backend peut retourner l'entité brute ou { status, subscription }
      const rawStatus = data?.status ?? data?.subscription?.status ?? 'pending';
      const status: 'pending' | 'active' | 'success' | 'failed' | 'cancelled' | 'expired' =
        rawStatus === 'active'    ? 'active'
        : rawStatus === 'failed'  ? 'failed'
        : rawStatus === 'cancelled' ? 'cancelled'
        : rawStatus === 'expired' ? 'expired'
        : 'pending';
      return {
        status,
        subscription: data?.subscription ? normalizeSubscription(data.subscription) : undefined,
      };
    } catch {
      return { status: 'pending' };
    }
  },

  // ─── Admin ─────────────────────────────────────────────────────────────

  async adminGetAll(): Promise<AdminSubscription[]> {
    try {
      const raw = await http.get<any[]>('/subscriptions/admin/all');
      return (raw ?? []).map((s: any) => ({
        id:        s.id,
        plan:      s.plan ?? '',
        status:    s.status ?? 'pending',
        amount:    s.amount ?? 0,
        currency:  s.currency ?? 'XOF',
        expiresAt: s.expiresAt ?? null,
        reference: s.reference ?? s.paystackRef ?? null,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
        user:      s.user ?? undefined,
      }));
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
