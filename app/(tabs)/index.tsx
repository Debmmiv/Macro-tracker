import React, { useMemo } from 'react';
import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '../../src/components/Screen';
import { Card } from '../../src/components/Card';
import { Button } from '../../src/components/Button';
import { ProgressBar } from '../../src/components/ProgressBar';
import { FoodItem } from '../../src/components/FoodItem';
import { Empty, ErrorView, Loading } from '../../src/components/StateViews';
import { useSession } from '../../src/context/SessionContext';
import { useDayEntries, useToday } from '../../src/hooks';
import { sumTotals } from '../../src/utils/calculations';
import { fmt } from '../../src/utils/format';
import { colors, type } from '../../src/theme';

export default function Home() {
  const router = useRouter();
  const { profile } = useSession();
  const today = useToday();
  const { entries, loading, error, reload } = useDayEntries(today);
  const totals = useMemo(() => sumTotals(entries), [entries]);

  const calTarget = profile?.daily_calorie_target ?? 0;
  const remaining = calTarget - totals.calories;
  const firstName = profile?.full_name?.split(' ')[0];

  const addFood = () => router.push({ pathname: '/food-form', params: { date: today } });
  const edit = (id: string) => router.push({ pathname: '/food-form', params: { id, date: today } });

  return (
    <Screen>
      <Text style={type.small}>{firstName ? `Hi, ${firstName}` : 'Hi'}</Text>
      <Text style={type.title}>Today</Text>

      <Card>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <View>
            <Text style={{ fontSize: 40, fontWeight: '700', color: remaining < 0 ? colors.danger : colors.ink, letterSpacing: -1 }}>
              {fmt(Math.abs(remaining))}
            </Text>
            <Text style={type.small}>{remaining < 0 ? 'kcal over target' : 'kcal remaining'}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={type.small}>Eaten {fmt(totals.calories)}</Text>
            <Text style={type.small}>Target {fmt(calTarget)}</Text>
          </View>
        </View>
        <ProgressBar label="Calories" value={totals.calories} target={calTarget} unit="kcal" color={colors.calories} />
        <ProgressBar label="Protein" value={totals.protein} target={profile?.protein_target ?? 0} unit="g" color={colors.protein} />
        <ProgressBar label="Carbohydrates" value={totals.carbohydrates} target={profile?.carbs_target ?? 0} unit="g" color={colors.carbs} />
        <ProgressBar label="Fat" value={totals.fat} target={profile?.fat_target ?? 0} unit="g" color={colors.fat} />
      </Card>

      <Button title="Add food" onPress={addFood} />

      <Text style={type.heading}>Today's food</Text>
      <Card style={{ paddingVertical: 4 }}>
        {loading ? (
          <Loading />
        ) : error ? (
          <ErrorView message={error} onRetry={reload} />
        ) : entries.length === 0 ? (
          <Empty title="Nothing logged yet" hint="Add your first meal to see your totals." />
        ) : (
          entries.map((e) => <FoodItem key={e.id} entry={e} showMeal onPress={() => edit(e.id)} />)
        )}
      </Card>
    </Screen>
  );
}
