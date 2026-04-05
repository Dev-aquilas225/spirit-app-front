import { useAuthStore } from '../store/auth.store';

/**
 * Hook principal d'authentification.
 * Expose les données utilisateur et les actions auth.
 */
export function useAuth() {
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);
  const isInitialized = useAuthStore((s) => s.isInitialized);
  const error = useAuthStore((s) => s.error);
  const login = useAuthStore((s) => s.login);
  const setPin = useAuthStore((s) => s.setPin);
  const logout = useAuthStore((s) => s.logout);
  const updateUser  = useAuthStore((s) => s.updateUser);
  const setLanguage = useAuthStore((s) => s.setLanguage);
  const clearError  = useAuthStore((s) => s.clearError);

  return {
    user,
    token,
    isAuthenticated,
    isLoading,
    isInitialized,
    error,
    login,
    setPin,
    logout,
    updateUser,
    setLanguage,
    clearError,
  };
}
