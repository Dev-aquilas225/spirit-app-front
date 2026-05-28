/**
 * useTypingText — Simule l'écriture caractère par caractère d'un texte.
 * Utilisé pour toutes les réponses (Rêves, Voyance, Prière).
 *
 * @param text    Texte final à afficher
 * @param speed   Délai en ms entre chaque caractère (défaut : 18ms)
 * @param enabled Active ou désactive l'effet (désactivé = affichage immédiat)
 */
import { useEffect, useRef, useState } from 'react';

export function useTypingText(text: string, speed = 18, enabled = true) {
  const [displayed, setDisplayed] = useState(enabled ? '' : text);
  const [isDone, setIsDone] = useState(!enabled);
  const indexRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevText  = useRef('');

  useEffect(() => {
    // Nouveau texte reçu — réinitialiser
    if (text !== prevText.current) {
      prevText.current = text;
      indexRef.current = 0;
      setIsDone(false);

      if (!enabled || !text) {
        setDisplayed(text);
        setIsDone(true);
        return;
      }

      setDisplayed('');
    }

    if (!enabled || isDone) return;

    function tick() {
      if (indexRef.current >= text.length) {
        setIsDone(true);
        return;
      }
      // Avancer par blocs de 2-3 chars pour les longs textes (>500 chars)
      const step = text.length > 500 ? 3 : 1;
      indexRef.current = Math.min(indexRef.current + step, text.length);
      setDisplayed(text.slice(0, indexRef.current));
      timerRef.current = setTimeout(tick, speed);
    }

    timerRef.current = setTimeout(tick, speed);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [text, enabled, speed]);

  // Permettre de sauter l'animation (tap)
  function skip() {
    if (timerRef.current) clearTimeout(timerRef.current);
    setDisplayed(text);
    setIsDone(true);
    indexRef.current = text.length;
  }

  return { displayed, isDone, skip };
}
