import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, type } from '../theme';
import { addDays, formatDay, toISODate } from '../utils/date';

export function DateNav({ date, onChange }: { date: string; onChange: (d: string) => void }) {
  const isToday = date === toISODate();
  return (
    <View style={styles.row}>
      <Pressable accessibilityLabel="Previous day" hitSlop={12} onPress={() => onChange(addDays(date, -1))}>
        <Ionicons name="chevron-back" size={24} color={colors.ink} />
      </Pressable>
      <Text style={type.heading}>{formatDay(date)}</Text>
      <Pressable
        accessibilityLabel="Next day"
        hitSlop={12}
        disabled={isToday}
        onPress={() => onChange(addDays(date, 1))}
        style={{ opacity: isToday ? 0.25 : 1 }}
      >
        <Ionicons name="chevron-forward" size={24} color={colors.ink} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 4 },
});
