import React from 'react';
import { Text, View } from 'react-native';
import { type } from '../theme';
import { Field } from './Field';

export interface TargetStrings {
  calories: string;
  protein: string;
  carbs: string;
  fat: string;
}

export function TargetsEditor({ value, onChange }: { value: TargetStrings; onChange: (v: TargetStrings) => void }) {
  const set = (k: keyof TargetStrings) => (t: string) => onChange({ ...value, [k]: t.replace(/[^0-9]/g, '') });
  const macroKcal = (Number(value.protein) || 0) * 4 + (Number(value.carbs) || 0) * 4 + (Number(value.fat) || 0) * 9;
  const cal = Number(value.calories) || 0;
  const diff = Math.abs(macroKcal - cal);
  return (
    <View style={{ gap: 12 }}>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <Field label="Calories" suffix="kcal" keyboardType="number-pad" value={value.calories} onChangeText={set('calories')} />
        <Field label="Protein" suffix="g" keyboardType="number-pad" value={value.protein} onChangeText={set('protein')} />
      </View>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <Field label="Carbohydrates" suffix="g" keyboardType="number-pad" value={value.carbs} onChangeText={set('carbs')} />
        <Field label="Fat" suffix="g" keyboardType="number-pad" value={value.fat} onChangeText={set('fat')} />
      </View>
      {diff > 100 ? (
        <Text style={type.small}>Your macros add up to about {macroKcal} kcal, which differs from your calorie target by {diff} kcal.</Text>
      ) : null}
    </View>
  );
}

export function validateTargets(t: TargetStrings): string | null {
  const cal = Number(t.calories);
  if (!cal || cal < 800 || cal > 8000) return 'Calories should be between 800 and 8,000.';
  if (t.protein === '' || t.carbs === '' || t.fat === '') return 'Enter a value for protein, carbohydrates and fat.';
  return null;
}
