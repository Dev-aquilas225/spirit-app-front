import { useCallback } from 'react';
import { router } from 'expo-router';
import { useAuthStore } from '../store/auth.store';
import { useSubscriptionStore } from '../store/subscription.store';

/**
 * Hook central de contrôle d'accès premium.
 * Utilisé pour vérifier si l'utilisateur peut accéder aux contenus premium
 * et rediriger vers l'abonnement si nécessaire.
 */
export function usePremiumAccess() {
  const user = useAuthStore((s) => s.user);
  const isActive = useSubscriptionStore((s) => s.isActive);

  // Admin = toujours premium.
  // Subscriber = premium seulement si l'abonnement est encore actif (date non expirée).
  // isActive est calculé par le store à partir de status === 'active' ET expiryDate > now.
  // Cela évite qu'un ancien subscriber garde l'accès après expiration.
  const isPremium = user?.role === 'admin' || (user?.role === 'subscriber' && isActive);
  const isFree = !isPremium;

  /**
   * Vérifie l'accès à un contenu.
   * Si le contenu est premium et l'utilisateur ne l'est pas, redirige.
   * @returns true si l'accès est autorisé
   */
  const checkAccess = useCallback(
    (requiredAccess: 'free' | 'premium'): boolean => {
      if (requiredAccess === 'free') return true;
      return isPremium;
    },
    [isPremium],
  );

  /**
   * Tente d'accéder à un contenu premium.
   * Redirige vers la page d'abonnement si non-abonné.
   */
  const accessPremium = useCallback(
    (onAllowed: () => void, onBlocked?: () => void): void => {
      if (isPremium) {
        onAllowed();
      } else {
        if (onBlocked) {
          onBlocked();
        } else {
          router.push('/subscription');
        }
      }
    },
    [isPremium],
  );

  /**
   * Redirige vers l'abonnement si l'utilisateur n'est pas premium.
   */
  const requirePremium = useCallback((): boolean => {
    if (!isPremium) {
      router.push('/subscription');
      return false;
    }
    return true;
  }, [isPremium]);

  return {
    isPremium,
    isFree,
    checkAccess,
    accessPremium,
    requirePremium,
  };
}
