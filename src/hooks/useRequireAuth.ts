import { router } from 'expo-router';
import { useAuthStore } from '../store/auth.store';

/**
 * Lazy login — à appeler avant une action qui nécessite d'être connecté.
 * Si l'utilisateur n'est pas connecté, redirige vers la page de login
 * et retourne false. Sinon retourne true.
 *
 * Usage :
 *   const requireAuth = useRequireAuth();
 *   const handlePay = () => { if (!requireAuth()) return; ... };
 */
export function useRequireAuth() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return (): boolean => {
    if (isAuthenticated) return true;
    router.push('/login');
    return false;
  };
}
