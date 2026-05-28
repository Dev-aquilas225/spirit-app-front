/**
 * useForceNotifications — demande la permission push au démarrage.
 * Appelé une seule fois après connexion. Si l'utilisateur refuse, on ne redemande pas.
 * Sur web : s'abonne aussi au push VAPID et enregistre la subscription backend.
 */
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { StorageService } from '../services/storage.service';
import { NotificationService } from '../services/notification.service';

const ASKED_KEY = '@spirit/push_asked';

export function useForceNotifications(isAuthenticated: boolean) {
  useEffect(() => {
    if (!isAuthenticated) return;

    async function ask() {
      try {
        // Ne demander qu'une seule fois (sauf si refusé → on réessaie à chaque session)
        const alreadyGranted = await StorageService.get<boolean>(ASKED_KEY);
        if (alreadyGranted) return;

        // Petit délai pour ne pas bloquer le rendu initial
        await new Promise((r) => setTimeout(r, 2000));

        const granted = await NotificationService.requestPermissions();
        if (granted) {
          await NotificationService.scheduleDailyNotifications();
          await StorageService.set(ASKED_KEY, true);
        }
        // Si refusé : on ne marque pas comme "asked" → on réessaiera à la prochaine session
      } catch {
        // Silencieux — ne pas bloquer l'app si les notifs échouent
      }
    }

    ask();
  }, [isAuthenticated]);
}
