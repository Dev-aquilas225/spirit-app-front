/**
 * Payment Service — Oracle Plus (Paystack via API backend)
 */
import { http, ApiError } from './http.client';

export type SubscriptionPlan = 'monthly' | 'yearly';
export type SubscriptionStatus = 'active' | 'expired' | 'cancelled' | 'pending';

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
}

export interface PaymentRecord {
  id: string;
  amount: number;
  currency: string;
  status: string;
  reference: string;
  createdAt: string;
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
      return await http.get<Subscription>('/subscriptions/me');
    } catch {
      return null;
    }
  },

  async getPaymentHistory(): Promise<PaymentRecord[]> {
    try {
      return await http.get<PaymentRecord[]>('/subscriptions/me/history');
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
