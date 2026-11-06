import React, { useEffect, useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Screen } from '../../src/components/Screen';
import { Card } from '../../src/components/Card';
import { Button } from '../../src/components/Button';
import { DateNav } from '../../src/components/DateNav';
import { FoodItem } from '../../src/components/FoodItem';
import { Empty, ErrorView, Loading } from '../../src/components/StateViews';
import { useDayEntries } from '../../src/hooks';
import { MEALS } from '../../src/utils/constants';
import { sumTotals } from '../../src/utils/calculations';
import { toISODate } from '../../src/utils/date';
import { fmt } from '../../src/utils/format';
import { type } from '../../src/theme';

export default function FoodLog() {
  const router = useRouter();
  const params = useLocalSearchParams<{ date?: string }>();
  const [date, setDate] = useState(params.date ?? toISODate());
  const { entries, loading, error, reload } = useDayEntries(date);

  // Follow the date passed from the History tab
  useEffect(() => {
    if (params.date) setDate(params.date);
  }, [params.date]);

  const totals = useMemo(() => sumTotals(entries), [entries]);

  const add = (meal?: string) => router.push({ pathname: '/food-form', params: { date, meal } });
  const edit = (id: string) => router.push({ pathname: '/food-form', params: { id, date } });

  return (
    <Screen>
      <Text style={type.title}>Food log</Text>
      <DateNav date={date} onChange={setDate} />
      <Text style={type.small}>
        {fmt(totals.calories)} kcal • P {fmt(totals.protein)}g • C {fmt(totals.carbohydrates)}g • F {fmt(totals.fat)}g
      </Text>

      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorView message={error} onRetry={reload} />
      ) : (
        MEALS.map((m) => {
          const items = entries.filter((e) => e.meal_type === m.value);
          const kcal = items.reduce((s, e) => s + Number(e.calories), 0);
          return (
            <Card key={m.value} style={{ paddingBottom: 8 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={type.heading}>{m.label}</Text>
                <Text style={type.small}>{fmt(kcal)} kcal</Text>
              </View>
              {items.length === 0 ? (
                <Empty title="" hint={`No ${m.label.toLowerCase()} logged`} />
              ) : (
                items.map((e) => <FoodItem key={e.id} entry={e} onPress={() => edit(e.id)} />)
              )}
              <Button title={`Add to ${m.label.toLowerCase()}`} variant="secondary" onPress={() => add(m.value)} />
            </Card>
          );
        })
      )}
    </Screen>
  );
}
