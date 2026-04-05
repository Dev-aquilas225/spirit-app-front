import { useCallback, useEffect, useState } from 'react';
import { PrayersService, DailyPrayer } from '../services/prayers.service';

export interface DailyPrayersState {
  morning: DailyPrayer | null;
  evening: DailyPrayer | null;
  /** Liste [morning, evening] sans null — pour itération */
  list: DailyPrayer[];
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useDailyPrayers(): DailyPrayersState {
  const [morning, setMorning] = useState<DailyPrayer | null>(null);
  const [evening, setEvening] = useState<DailyPrayer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const data = await PrayersService.getDaily();
    setMorning(data.morning);
    setEvening(data.evening);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const list = [morning, evening].filter((p): p is DailyPrayer => p !== null);

  return { morning, evening, list, isLoading, error, refresh: load };
}
