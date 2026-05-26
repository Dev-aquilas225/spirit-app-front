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
  /** WebView (Google App, Facebook, Instagram, etc.) : guider vers Chrome */
  canShowWebView: boolean;
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

/**
 * Détecte les WebViews qui ne supportent pas l'installation PWA :
 * - Google App (GSA)
 * - Facebook / Instagram / Messenger (FBAN/FBAV)
 * - TikTok, Snapchat, Twitter/X
 * - Android WebView générique
 */
function detectWebView(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  return (
    /GSA\//.test(ua) ||           // Google App (Search)
    /FBAN|FBAV/.test(ua) ||       // Facebook / Instagram
    /Twitter/.test(ua) ||         // Twitter/X
    /BytedanceWebview/.test(ua) || // TikTok
    /Snapchat/.test(ua) ||        // Snapchat
    (/wv/.test(ua) && /Android/.test(ua)) // Android WebView générique
  );
}

export function usePWAInstall(): PWAInstallState {
  const [prompt,      setPrompt]      = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [dismissed,   setDismissed]   = useState(false);
  const [isIOSSafari, setIsIOSSafari] = useState(false);
  const [isWebView,   setIsWebView]   = useState(false);

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

    // ── Détection WebView (Google App, Facebook, etc.) ────────────────────────
    setIsWebView(detectWebView());

    // ── Chrome / Edge : beforeinstallprompt ───────────────────────────────────
    // L'event peut avoir été capturé avant le montage React (via +html.tsx)
    const preCapture = (window as any).__pwaInstallPrompt;
    if (preCapture) {
      setPrompt(preCapture as BeforeInstallPromptEvent);
      (window as any).__pwaInstallPrompt = null;
    }

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
    canShowNative:  Platform.OS === 'web' && prompt !== null && !isInstalled && !dismissed,
    canShowIOS:     Platform.OS === 'web' && isIOSSafari     && !isInstalled && !dismissed,
    canShowWebView: Platform.OS === 'web' && isWebView       && !isInstalled && !dismissed,
    isInstalled,
    install,
    dismiss,
  };
}
