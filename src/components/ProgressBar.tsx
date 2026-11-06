import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, type } from '../theme';
import { fmt } from '../utils/format';

interface Props {
  label: string;
  value: number;
  target: number;
  unit: string;
  color: string;
}

export function ProgressBar({ label, value, target, unit, color }: Props) {
  const pct = target > 0 ? Math.min(1, value / target) : 0;
  const over = target > 0 && value > target;
  return (
    <View style={{ gap: 6 }}>
      <View style={styles.row}>
        <Text style={type.body}>{label}</Text>
        <Text style={type.small}>
          <Text style={{ color: over ? colors.danger : colors.ink, fontWeight: '600' }}>{fmt(value)}</Text> / {fmt(target)} {unit}
        </Text>
      </View>
      <View style={styles.track} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: Math.round(pct * 100) }}>
        <View style={[styles.fill, { width: `${pct * 100}%`, backgroundColor: over ? colors.danger : color }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  track: { height: 10, borderRadius: 5, backgroundColor: colors.line, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 5 },
});
