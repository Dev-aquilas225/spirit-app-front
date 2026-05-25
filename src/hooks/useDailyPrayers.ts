import { useEffect, useState } from 'react';
import { DailyPrayer, DailyPrayers, Prayer, PrayersService } from '../services/prayers.service';

interface UseDailyPrayersResult {
  morning: DailyPrayer | null;
  evening: DailyPrayer | null;
  list: Prayer[];
  isLoading: boolean;
  currentlyPlayingId: string | null;
  setCurrentlyPlayingId: (id: string | null) => void;
}

export function useDailyPrayers(): UseDailyPrayersResult {
  const [morning, setMorning] = useState<DailyPrayer | null>(null);
  const [evening, setEvening] = useState<DailyPrayer | null>(null);
  const [list, setList] = useState<Prayer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentlyPlayingId, setCurrentlyPlayingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      const [daily, prayers] = await Promise.all([
        PrayersService.getDaily(),
        PrayersService.getAll(),
      ]);
      if (!cancelled) {
        setMorning(daily.morning);
        setEvening(daily.evening);
        setList(prayers);
        setIsLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  return { morning, evening, list, isLoading, currentlyPlayingId, setCurrentlyPlayingId };
}
