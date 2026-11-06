import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, type } from '../theme';
import { FoodEntry } from '../types';
import { mealLabel } from '../utils/constants';
import { fmt } from '../utils/format';

export function FoodItem({ entry, onPress, showMeal }: { entry: FoodEntry; onPress: () => void; showMeal?: boolean }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, pressed && { opacity: 0.6 }]}>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={type.body} numberOfLines={1}>{entry.food_name}</Text>
        <Text style={type.small} numberOfLines={1}>
          {showMeal ? `${mealLabel(entry.meal_type)} • ` : ''}
          {entry.serving_size ? `${entry.serving_size} • ` : ''}
          P {fmt(entry.protein)}g  C {fmt(entry.carbohydrates)}g  F {fmt(entry.fat)}g
        </Text>
      </View>
      <Text style={[type.body, { fontWeight: '600' }]}>{fmt(entry.calories)} kcal</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
  },
});
