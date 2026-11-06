import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { listEntriesForDate } from './services/foodService';
import { FoodEntry } from './types';
import { toISODate } from './utils/date';

/** Loads entries for a date, refreshing every time the screen is focused. */
export function useDayEntries(date: string) {
  const [entries, setEntries] = useState<FoodEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      setEntries(await listEntriesForDate(date));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load food entries.');
    } finally {
      setLoading(false);
    }
  }, [date]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load();
    }, [load]),
  );

  return { entries, loading, error, reload: load };
}

/** Returns today's date and updates it when the day rolls over or the app returns to the foreground. */
export function useToday(): string {
  const [today, setToday] = useState(toISODate());
  useEffect(() => {
    const sync = () => setToday(toISODate());
    const sub = AppState.addEventListener('change', (s) => s === 'active' && sync());
    const id = setInterval(sync, 60_000);
    return () => {
      sub.remove();
      clearInterval(id);
    };
  }, []);
  return today;
}
