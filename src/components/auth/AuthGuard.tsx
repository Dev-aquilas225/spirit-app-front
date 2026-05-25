import { router, useSegments } from 'expo-router';
import React, { useEffect } from 'react';
import { useI18n } from '../../i18n';
import { useAuthStore } from '../../store/auth.store';
import { LoadingSpinner } from '../common/LoadingSpinner';

interface AuthGuardProps {
  children: React.ReactNode;
  /** Si true, redirige vers login si non connecté (pour les pages premium) */
  requireAuth?: boolean;
}

export function AuthGuard({ children, requireAuth = false }: AuthGuardProps) {
  const isAuthenticated   = useAuthStore((s) => s.isAuthenticated);
  const isInitialized     = useAuthStore((s) => s.isInitialized);
  const isProfileComplete = useAuthStore((s) => s.isProfileComplete);
  const segments          = useSegments();
  const { t } = useI18n();

  useEffect(() => {
    if (!isInitialized) return;

    // Lazy login : rediriger vers login uniquement si la page l'exige explicitement
    if (requireAuth && !isAuthenticated) {
      router.replace('/(auth)/login');
      return;
    }

    // Si connecté et profil incomplet → compléter le profil
    if (isAuthenticated && !isProfileComplete) {
      const onCompleteProfile = segments.join('/').includes('complete-profile');
      if (!onCompleteProfile) {
        router.replace('/(app)/complete-profile');
      }
    }
  }, [isAuthenticated, isInitialized, isProfileComplete, requireAuth, segments]);

  if (!isInitialized) {
    return <LoadingSpinner fullScreen message={t.common.loading} />;
  }

  // Sans requireAuth : afficher le contenu même sans connexion
  return <>{children}</>;
}
