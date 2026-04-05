import { useState, useEffect } from 'react';
import { Platform } from 'react-native';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export interface PWAInstallState {
  /** Chrome/Edge Desktop+Android : bouton natif disponible */
  canShowNative: boolean;
  /** iOS Safari : afficher les instructions manuelles "Partager → Écran d'accueil" */
  canShowIOS: boolean;
  /** L'app tourne déjà en mode standalone (installée) */
  isInstalled: boolean;
  install: () => Promise<void>;
  dismiss: () => void;
}

/**
 * Détecte si l'on est sur Safari iOS (et pas Chrome/Firefox iOS).
 * CriOS = Chrome iOS, FxiOS = Firefox iOS, OPiOS = Opera iOS.
 * Sur tous ces navigateurs, les PWA NE peuvent PAS être installées.
 * Seul Safari natif iOS le permet via "Partager → Sur l'écran d'accueil".
 */
function detectIOSSafari(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua);
  const isThirdPartyBrowser = /CriOS|FxiOS|OPiOS|mercury|EdgiOS/.test(ua);
  return isIOS && !isThirdPartyBrowser;
}

export function usePWAInstall(): PWAInstallState {
  const [prompt,      setPrompt]      = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [dismissed,   setDismissed]   = useState(false);
  const [isIOSSafari, setIsIOSSafari] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;

    // ── Déjà installée ────────────────────────────────────────────────────────
    const standalone =
      window.matchMedia?.('(display-mode: standalone)').matches ||
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (navigator as any).standalone === true;

    if (standalone) {
      setIsInstalled(true);
      return;
    }

    // ── Détection iOS Safari ──────────────────────────────────────────────────
    setIsIOSSafari(detectIOSSafari());

    // ── Chrome / Edge : beforeinstallprompt ───────────────────────────────────
    function onBeforeInstall(e: Event) {
      e.preventDefault();
      setPrompt(e as BeforeInstallPromptEvent);
    }

    function onAppInstalled() {
      setIsInstalled(true);
      setPrompt(null);
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled',        onAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled',        onAppInstalled);
    };
  }, []);

  async function install() {
    if (!prompt) return;
    await prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === 'accepted') {
      setPrompt(null);
      setDismissed(true);
    }
  }

  function dismiss() {
    setDismissed(true);
  }

  return {
    canShowNative: Platform.OS === 'web' && prompt !== null && !isInstalled && !dismissed,
    canShowIOS:    Platform.OS === 'web' && isIOSSafari     && !isInstalled && !dismissed,
    isInstalled,
    install,
    dismiss,
  };
}
