import { create } from 'zustand';
import { PaymentService, Subscription, PaymentRecord, SubscriptionPlan, InitiateResult } from '../services/payment.service';
import { useAuthStore } from './auth.store';
import { isSubscriptionActive, getDaysUntilExpiry } from '../utils/helpers';

interface SubscriptionStore {
  subscription: Subscription | null;
  payments: PaymentRecord[];
  isLoading: boolean;
  isProcessingPayment: boolean;
  paymentError: string | null;
  pendingReference: string | null;

  // Computed
  isActive: boolean;
  daysUntilExpiry: number;

  // Actions
  loadSubscription: () => Promise<void>;
  initiatePayment: (plan?: SubscriptionPlan) => Promise<InitiateResult | null>;
  verifyPayment: (reference: string) => Promise<boolean>;
  cancelSubscription: () => Promise<void>;
  clearPaymentError: () => void;
}

export const useSubscriptionStore = create<SubscriptionStore>((set, get) => ({
  subscription: null,
  payments: [],
  isLoading: false,
  isProcessingPayment: false,
  paymentError: null,
  pendingReference: null,
  isActive: false,
  daysUntilExpiry: 0,

  loadSubscription: async () => {
    set({ isLoading: true });
    const [subscription, payments] = await Promise.all([
      PaymentService.getMySubscription(),
      PaymentService.getPaymentHistory(),
    ]);

    const isActive = subscription
      ? subscription.status === 'active' && isSubscriptionActive(subscription.expiryDate)
      : false;

    const daysUntilExpiry = subscription?.expiryDate
      ? getDaysUntilExpiry(subscription.expiryDate)
      : 0;

    set({ subscription, payments, isActive, daysUntilExpiry, isLoading: false });
  },

  /**
   * Étape 1 : initier le paiement Paystack.
   * Retourne { authorization_url, reference } pour rediriger l'utilisateur.
   */
  initiatePayment: async (plan = 'monthly') => {
    set({ isProcessingPayment: true, paymentError: null, pendingReference: null });

    const result = await PaymentService.initiate(plan);

    if (result.error || !result.data) {
      set({ isProcessingPayment: false, paymentError: result.error ?? 'Paiement échoué' });
      return null;
    }

    set({ isProcessingPayment: false, pendingReference: result.data.reference });
    return result.data;
  },

  /**
   * Étape 2 : vérifier le paiement après retour de Paystack.
   * Appeler avec la référence obtenue depuis initiatePayment.
   */
  verifyPayment: async (reference: string) => {
    set({ isLoading: true, paymentError: null });

    const result = await PaymentService.verifyPayment(reference);

    if (!result.success) {
      set({ isLoading: false, paymentError: result.error ?? 'Vérification échouée' });
      return false;
    }

    const subscription = result.subscription ?? await PaymentService.getMySubscription();
    const isActive = subscription
      ? subscription.status === 'active' && isSubscriptionActive(subscription.expiryDate)
      : false;

    const payments = await PaymentService.getPaymentHistory();

    set({
      subscription,
      isActive,
      daysUntilExpiry: subscription?.expiryDate ? getDaysUntilExpiry(subscription.expiryDate) : 0,
      payments,
      pendingReference: null,
      isLoading: false,
    });

    if (isActive) {
      useAuthStore.getState().upgradeToSubscriber();
    }

    return true;
  },

  cancelSubscription: async () => {
    set({ isLoading: true });
    await PaymentService.cancel();

    const subscription = await PaymentService.getMySubscription();
    set({ subscription, isActive: false, isLoading: false });

    useAuthStore.getState().downgradeToFree();
  },

  clearPaymentError: () => set({ paymentError: null }),
}));
