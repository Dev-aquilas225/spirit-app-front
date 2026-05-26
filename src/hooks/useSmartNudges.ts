/**
 * useSmartNudges — behavioral nudge system
 *
 * - Fires a non-blocking toast every 15 minutes
 * - Messages rotate based on time of day and user context
 * - Never interrupts navigation (toast only, no modal)
 * - Subscribers get nudges every 30min instead of 15
 */
import { useEffect, useRef } from 'react';
import { useAccess } from './useAccess';
import { useNudgeStore } from '../store/nudge.store';

const NUDGE_INTERVAL_MS = 15 * 60 * 1000;

const NUDGE_MESSAGES = [
  { text: 'Veux-tu un aperçu de ton lendemain ?',              route: '/dreams' },
  { text: 'Ton mariage te préoccupe ? Le guide t\'attend.',    route: '/consultation/chat' },
  { text: 'Une prière personnalisée peut changer ta journée.', route: '/prayers' },
  { text: 'Ton rêve de cette nuit a peut-être un message.',    route: '/dreams' },
  { text: 'Besoin d\'orientation spirituelle ? Consulte.',     route: '/consultation/chat' },
  { text: 'Un livre spirituel t\'attend en bibliothèque.',     route: '/library' },
  { text: 'Ton suivi spirituel de la semaine est prêt.',       route: '/accompagnements' },
  { text: 'Veux-tu connaître ton chiffre spirituel ?',         route: '/ai' },
  { text: 'Une pensée prophétique pour toi ce soir.',          route: '/consultation/chat' },
  { text: 'Invite un ami et gagnez des crédits ensemble !',    route: '/referral' },
];

function getContextualNudge(hour: number, index: number) {
  if (hour >= 6 && hour < 12)  return NUDGE_MESSAGES[index % 3];
  if (hour >= 12 && hour < 18) return NUDGE_MESSAGES[3 + (index % 3)];
  return NUDGE_MESSAGES[6 + (index % 4)];
}

export function useSmartNudges() {
  const { hasSubscription } = useAccess();
  const { showNudge, nudgeIndex, incrementIndex } = useNudgeStore();
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const interval = hasSubscription ? NUDGE_INTERVAL_MS * 2 : NUDGE_INTERVAL_MS;

    timerRef.current = setInterval(() => {
      const hour = new Date().getHours();
      const nudge = getContextualNudge(hour, nudgeIndex);
      showNudge(nudge.text, nudge.route);
      incrementIndex();
    }, interval);

    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [hasSubscription, nudgeIndex]);
}
