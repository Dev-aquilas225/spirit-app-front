import { useEffect } from 'react';
import { useSubscriptionStore } from '../store/subscription.store';
import { useAuthStore } from '../store/auth.store';
import { SubscriptionPlan } from '../services/payment.service';

/**
 * Hook pour gérer l'abonnement de l'utilisateur.
 * Charge automatiquement les données au montage si l'utilisateur est authentifié.
 */
export function useSubscription() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const subscription = useSubscriptionStore((s) => s.subscription);
  const payments = useSubscriptionStore((s) => s.payments);
  const isLoading = useSubscriptionStore((s) => s.isLoading);
  const isProcessingPayment = useSubscriptionStore((s) => s.isProcessingPayment);
  const paymentError = useSubscriptionStore((s) => s.paymentError);
  const pendingReference = useSubscriptionStore((s) => s.pendingReference);
  const isActive = useSubscriptionStore((s) => s.isActive);
  const daysUntilExpiry = useSubscriptionStore((s) => s.daysUntilExpiry);
  const loadSubscription = useSubscriptionStore((s) => s.loadSubscription);
  const initiatePayment = useSubscriptionStore((s) => s.initiatePayment);
  const verifyPayment = useSubscriptionStore((s) => s.verifyPayment);
  const cancelSubscription = useSubscriptionStore((s) => s.cancelSubscription);
  const clearPaymentError = useSubscriptionStore((s) => s.clearPaymentError);

  useEffect(() => {
    if (isAuthenticated) {
      loadSubscription();
    }
  }, [isAuthenticated]);

  const isExpiringSoon = daysUntilExpiry > 0 && daysUntilExpiry <= 5;

  return {
    subscription,
    payments,
    isLoading,
    isProcessingPayment,
    paymentError,
    pendingReference,
    isActive,
    daysUntilExpiry,
    isExpiringSoon,
    loadSubscription,
    initiatePayment,
    verifyPayment,
    cancelSubscription,
    clearPaymentError,
  };
}
