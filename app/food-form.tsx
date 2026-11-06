import React, { useEffect, useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Screen } from '../src/components/Screen';
import { Field } from '../src/components/Field';
import { Chips } from '../src/components/Chips';
import { Button } from '../src/components/Button';
import { Loading } from '../src/components/StateViews';
import { useSession } from '../src/context/SessionContext';
import { addEntry, deleteEntry, getEntry, updateEntry } from '../src/services/foodService';
import { MEALS } from '../src/utils/constants';
import { parseNum } from '../src/utils/format';
import { toISODate } from '../src/utils/date';
import { MealType } from '../src/types';
import { type } from '../src/theme';

function defaultMeal(): MealType {
  const h = new Date().getHours();
  return h < 11 ? 'breakfast' : h < 16 ? 'lunch' : h < 21 ? 'dinner' : 'snacks';
}

export default function FoodForm() {
  const router = useRouter();
  const { session } = useSession();
  const { id, date, meal } = useLocalSearchParams<{ id?: string; date?: string; meal?: string }>();
  const editing = Boolean(id);

  const [name, setName] = useState('');
  const [serving, setServing] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [mealType, setMealType] = useState<MealType>(MEALS.some((m) => m.value === meal) ? (meal as MealType) : defaultMeal());
  const [entryDate, setEntryDate] = useState(date ?? toISODate());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(editing);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!id) return;
    getEntry(id)
      .then((e) => {
        setName(e.food_name);
        setServing(e.serving_size ?? '');
        setCalories(String(e.calories));
        setProtein(String(e.protein));
        setCarbs(String(e.carbohydrates));
        setFat(String(e.fat));
        setMealType(e.meal_type);
        setEntryDate(e.entry_date);
      })
      .catch((err) => {
        Alert.alert('Could not load entry', err instanceof Error ? err.message : 'Please try again.');
        router.back();
      })
      .finally(() => setLoading(false));
  }, [id, router]);

  const save = async () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'Enter a food name';
    const cal = parseNum(calories);
    if (cal === null) e.calories = 'Enter a number';
    // Macros are optional; blank counts as 0
    const p = protein.trim() === '' ? 0 : parseNum(protein);
    const c = carbs.trim() === '' ? 0 : parseNum(carbs);
    const f = fat.trim() === '' ? 0 : parseNum(fat);
    if (p === null) e.protein = 'Enter a number';
    if (c === null) e.carbs = 'Enter a number';
    if (f === null) e.fat = 'Enter a number';
    setErrors(e);
    if (Object.keys(e).length || !session) return;

    const input = {
      food_name: name.trim(),
      serving_size: serving.trim() || null,
      calories: cal!,
      protein: p!,
      carbohydrates: c!,
      fat: f!,
      meal_type: mealType,
      entry_date: entryDate,
    };
    setBusy(true);
    try {
      if (editing && id) await updateEntry(id, input);
      else await addEntry(session.user.id, input);
      router.back();
    } catch (err) {
      Alert.alert('Could not save', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const remove = () =>
    Alert.alert('Delete this entry?', name, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteEntry(id!);
            router.back();
          } catch (err) {
            Alert.alert('Could not delete', err instanceof Error ? err.message : 'Please try again.');
          }
        },
      },
    ]);

  if (loading) return <Screen><Loading /></Screen>;

  return (
    <Screen>
      <Text style={type.title}>{editing ? 'Edit food' : 'Add food'}</Text>
      <View style={{ flexDirection: 'row' }}>
        <Field label="Food name" value={name} onChangeText={setName} error={errors.name} autoFocus={!editing} />
      </View>
      <View style={{ flexDirection: 'row' }}>
        <Field label="Serving size (optional)" placeholder="e.g. 1 cup, 100 g" value={serving} onChangeText={setServing} />
      </View>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <Field label="Calories" suffix="kcal" keyboardType="decimal-pad" value={calories} onChangeText={setCalories} error={errors.calories} />
        <Field label="Protein" suffix="g" keyboardType="decimal-pad" value={protein} onChangeText={setProtein} error={errors.protein} />
      </View>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <Field label="Carbohydrates" suffix="g" keyboardType="decimal-pad" value={carbs} onChangeText={setCarbs} error={errors.carbs} />
        <Field label="Fat" suffix="g" keyboardType="decimal-pad" value={fat} onChangeText={setFat} error={errors.fat} />
      </View>
      <Chips label="Meal" options={MEALS} value={mealType} onChange={setMealType} />
      <Button title={editing ? 'Save changes' : 'Add food'} onPress={save} loading={busy} />
      {editing ? <Button title="Delete entry" variant="danger" onPress={remove} /> : null}
      <Button title="Cancel" variant="secondary" onPress={() => router.back()} />
    </Screen>
  );
}
