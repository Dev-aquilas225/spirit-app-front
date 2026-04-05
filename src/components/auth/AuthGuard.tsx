import { router } from 'expo-router';
import React, { useEffect } from 'react';
import { useAuthStore } from '../../store/auth.store';
import { LoadingSpinner } from '../common/LoadingSpinner';

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isInitialized   = useAuthStore((s) => s.isInitialized);

  useEffect(() => {
    if (!isInitialized) return;
    if (!isAuthenticated) {
      router.replace('/(auth)/login');
    }
  }, [isAuthenticated, isInitialized]);

  if (!isInitialized) {
    return <LoadingSpinner fullScreen message="Chargement..." />;
  }

  if (!isAuthenticated) {
    return <LoadingSpinner fullScreen />;
  }

  return <>{children}</>;
}
