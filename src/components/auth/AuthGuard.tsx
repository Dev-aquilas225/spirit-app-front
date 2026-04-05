import { router, useSegments } from 'expo-router';
import React, { useEffect } from 'react';
import { useI18n } from '../../i18n';
import { useAuthStore } from '../../store/auth.store';
import { LoadingSpinner } from '../common/LoadingSpinner';

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const isAuthenticated  = useAuthStore((s) => s.isAuthenticated);
  const isInitialized    = useAuthStore((s) => s.isInitialized);
  const isProfileComplete = useAuthStore((s) => s.isProfileComplete);
  const segments         = useSegments();
  const { t } = useI18n();

  useEffect(() => {
    if (!isInitialized) return;

    if (!isAuthenticated) {
      router.replace('/(auth)/login');
      return;
    }

    // Si le profil est incomplet, rediriger vers complete-profile
    // sauf si on y est déjà (éviter les boucles)
    const onCompleteProfile = segments.join('/').includes('complete-profile');
    if (!isProfileComplete && !onCompleteProfile) {
      router.replace('/(app)/complete-profile');
    }
  }, [isAuthenticated, isInitialized, isProfileComplete, segments]);

  if (!isInitialized) {
    return <LoadingSpinner fullScreen message={t.common.loading} />;
  }

  if (!isAuthenticated) {
    return <LoadingSpinner fullScreen />;
  }

  return <>{children}</>;
}
