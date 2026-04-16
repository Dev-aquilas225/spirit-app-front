import { useEffect } from 'react';
import { Platform } from 'react-native';

/**
 * Bloque les tentatives de capture d'écran sur les pages de contenu premium.
 *
 * Web    → détecte PrintScreen + désactive le menu contextuel (clic droit)
 * Native → utilise expo-screen-capture si disponible
 */
export function useScreenProtection(enabled = true) {
  useEffect(() => {
    if (!enabled) return;

    if (Platform.OS === 'web') {
      // Intercepter la touche PrintScreen
      const handleKey = (e: KeyboardEvent) => {
        if (e.key === 'PrintScreen' || e.code === 'PrintScreen') {
          e.preventDefault();
          // Vider le presse-papiers immédiatement (contient la capture)
          navigator.clipboard?.writeText('').catch(() => {});
        }
      };

      // Désactiver le clic droit sur le contenu protégé
      const handleContext = (e: MouseEvent) => {
        e.preventDefault();
      };

      // Désactiver le glisser-déposer des images
      const handleDragStart = (e: DragEvent) => {
        e.preventDefault();
      };

      document.addEventListener('keyup', handleKey);
      document.addEventListener('contextmenu', handleContext);
      document.addEventListener('dragstart', handleDragStart);

      // Style CSS inline pour empêcher la sélection de texte
      const style = document.createElement('style');
      style.id = 'screen-protect';
      style.textContent = `
        body {
          -webkit-user-select: none;
          -moz-user-select: none;
          user-select: none;
          -webkit-touch-callout: none;
        }
        img, video {
          pointer-events: none;
        }
      `;
      document.head.appendChild(style);

      return () => {
        document.removeEventListener('keyup', handleKey);
        document.removeEventListener('contextmenu', handleContext);
        document.removeEventListener('dragstart', handleDragStart);
        document.getElementById('screen-protect')?.remove();
      };
    }

    // Native — expo-screen-capture (optionnel)
    let cleanup: (() => void) | undefined;
    (async () => {
      try {
        const ScreenCapture = await import('expo-screen-capture');
        await ScreenCapture.preventScreenCaptureAsync();
        cleanup = () => {
          ScreenCapture.allowScreenCaptureAsync().catch(() => {});
        };
      } catch {
        // expo-screen-capture non installé — silencieux
      }
    })();

    return () => cleanup?.();
  }, [enabled]);
}
