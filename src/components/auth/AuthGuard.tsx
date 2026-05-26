import { router, useSegments } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { useAuthStore } from '../../store/auth.store';
import { LoadingSpinner } from '../common/LoadingSpinner';

interface AuthGuardProps {
  children: React.ReactNode;
  /**
   * Si true, redirige vers login si non connecté.
   * Par défaut false — accès libre (freemium).
   */
  requireAuth?: boolean;
}

// Délai max avant de forcer le passage même si le store n'est pas prêt
const INIT_TIMEOUT_MS = 2000;

export function AuthGuard({ children, requireAuth = false }: AuthGuardProps) {
  const isAuthenticated   = useAuthStore((s) => s.isAuthenticated);
  const isInitialized     = useAuthStore((s) => s.isInitialized);
  const isProfileComplete = useAuthStore((s) => s.isProfileComplete);
  const segments          = useSegments();

  const [timedOut, setTimedOut] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Sans requireAuth : pas besoin d'attendre — on affiche immédiatement
    if (!requireAuth) return;

    if (isInitialized) {
      if (timerRef.current) clearTimeout(timerRef.current);
      return;
    }
    timerRef.current = setTimeout(() => setTimedOut(true), INIT_TIMEOUT_MS);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isInitialized, requireAuth]);

  const ready = !requireAuth || isInitialized || timedOut;

  useEffect(() => {
    if (!ready) return;

    // Rediriger vers login uniquement si la page l'exige explicitement
    if (requireAuth && !isAuthenticated) {
      router.replace('/login');
      return;
    }

    // Si connecté et profil incomplet → compléter le profil
    if (isAuthenticated && isInitialized && !isProfileComplete) {
      const onCompleteProfile = segments.join('/').includes('complete-profile');
      if (!onCompleteProfile) {
        router.replace('/complete-profile');
      }
    }
  }, [isAuthenticated, ready, isInitialized, isProfileComplete, requireAuth, segments]);

  // Bloquer uniquement si requireAuth ET pas encore prêt
  if (!ready) {
    return <LoadingSpinner fullScreen message="Chargement…" />;
  }

  return <>{children}</>;
}
