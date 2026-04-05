/**
 * Payment Service — Oracle Plus (Paystack via API backend)
 */
import { http, ApiError } from './http.client';

export type SubscriptionPlan = 'monthly' | 'yearly';
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

export interface InitiateResult {
  subscriptionId: string;
  reference: string;
  authorization_url: string;
  access_code: string;
  amount: number;
  currency: string;
  plan: SubscriptionPlan;
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
      const result = await http.get<Partial<Subscription>>('/subscriptions/me');
      if (!result?.id) return null;
      return {
        id: result.id,
        plan: result.plan ?? 'monthly',
        status: result.status ?? 'active',
        startDate: result.startDate ?? new Date().toISOString(),
        expiryDate: result.expiryDate ?? new Date().toISOString(),
        autoRenew: result.autoRenew ?? false,
        amount: result.amount ?? 5000,
        currency: 'FCFA',
      };
    } catch {
      return null;
    }
  },

  async getPaymentHistory(): Promise<PaymentRecord[]> {
    try {
      const result = await http.get<Partial<PaymentRecord>[]>('/subscriptions/me/history');
      return result.map((item) => ({
        id: item.id ?? `${item.reference ?? 'payment'}-${item.createdAt ?? Date.now()}`,
        userId: item.userId ?? '',
        amount: item.amount ?? 5000,
        currency: 'FCFA',
        method: (item.method as PaymentMethod) ?? 'card',
        status: item.status ?? 'pending',
        reference: item.reference ?? '',
        createdAt: item.createdAt ?? new Date().toISOString(),
        description: item.description ?? 'Abonnement Premium',
      }));
    } catch {
      return [];
    }
  },

  /**
   * Initier un paiement Paystack.
   * Retourne l'URL de paiement vers laquelle rediriger l'utilisateur.
   */
  async initiate(plan: SubscriptionPlan, autoRenew = false): Promise<{ data?: InitiateResult; error?: string }> {
    try {
      const result = await http.post<InitiateResult>('/subscriptions/initiate', { plan, autoRenew });
      return { data: result };
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

  async cancel(): Promise<{ error?: string }> {
    try {
      await http.delete('/subscriptions/me/cancel');
      return {};
    } catch (e) {
      return { error: (e as ApiError).message };
    }
  },
};
