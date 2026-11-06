import React, { useCallback, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Screen } from '../../src/components/Screen';
import { Card } from '../../src/components/Card';
import { ProgressBar } from '../../src/components/ProgressBar';
import { Empty, ErrorView, Loading } from '../../src/components/StateViews';
import { useSession } from '../../src/context/SessionContext';
import { listEntriesInRange } from '../../src/services/foodService';
import { sumTotals } from '../../src/utils/calculations';
import { addDays, formatDay, toISODate } from '../../src/utils/date';
import { fmt } from '../../src/utils/format';
import { colors, type } from '../../src/theme';
import { FoodEntry } from '../../src/types';

const DAYS = 60;

interface Day {
  date: string;
  entries: FoodEntry[];
}

export default function History() {
  const router = useRouter();
  const { profile } = useSession();
  const [days, setDays] = useState<Day[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const today = toISODate();
      const rows = await listEntriesInRange(addDays(today, -(DAYS - 1)), today);
      const byDate = new Map<string, FoodEntry[]>();
      rows.forEach((r) => byDate.set(r.entry_date, [...(byDate.get(r.entry_date) ?? []), r]));
      setDays([...byDate.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1)).map(([date, entries]) => ({ date, entries })));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load history.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load();
    }, [load]),
  );

  return (
    <Screen>
      <Text style={type.title}>History</Text>
      <Text style={type.small}>Your last {DAYS} days. Tap a day to review or edit it.</Text>
      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorView message={error} onRetry={load} />
      ) : days.length === 0 ? (
        <Empty title="No history yet" hint="Days you log food on will show up here." />
      ) : (
        days.map(({ date, entries }) => {
          const t = sumTotals(entries);
          return (
            <Pressable key={date} onPress={() => router.navigate({ pathname: '/food-log', params: { date } })}>
              <Card>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={type.heading}>{formatDay(date)}</Text>
                  <Text style={type.small}>{entries.length} {entries.length === 1 ? 'item' : 'items'}</Text>
                </View>
                <ProgressBar label="Calories" value={t.calories} target={profile?.daily_calorie_target ?? 0} unit="kcal" color={colors.calories} />
                <Text style={type.small}>
                  P {fmt(t.protein)}g • C {fmt(t.carbohydrates)}g • F {fmt(t.fat)}g
                </Text>
              </Card>
            </Pressable>
          );
        })
      )}
    </Screen>
  );
}
