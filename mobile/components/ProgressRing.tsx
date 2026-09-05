import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Text } from 'react-native';

interface Props {
  label: string;
  value: number;
  target: number | null;
  unit: string;
  color: string;
}

export default function ProgressRing({ label, value, target, unit, color }: Props) {
  const pct = target ? Math.min(100, Math.round((value / target) * 100)) : 0;
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <View style={styles.container}>
      <View style={styles.ringWrapper}>
        <Svg width={100} height={100} viewBox="0 0 100 100" style={styles.svg}>
          {/* Track */}
          <Circle
            cx="50" cy="50" r={radius}
            fill="none" stroke="#E7E2D6" strokeWidth={10}
          />
          {/* Progress */}
          <Circle
            cx="50" cy="50" r={radius}
            fill="none" stroke={color} strokeWidth={10}
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={offset}
            strokeLinecap="round"
            rotation="-90"
            origin="50, 50"
          />
        </Svg>
        <View style={styles.centerLabel}>
          <Text style={styles.valueText}>{Math.round(value)}</Text>
          <Text style={styles.unitText}>{unit || 'kcal'}</Text>
        </View>
      </View>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.subLabel}>
        {target ? `${pct}% of ${target}${unit}` : 'no target set'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center' },
  ringWrapper: { width: 100, height: 100, position: 'relative', alignItems: 'center', justifyContent: 'center' },
  svg: { position: 'absolute', top: 0, left: 0 },
  centerLabel: { alignItems: 'center' },
  valueText: { fontSize: 18, fontWeight: '600', color: '#1C2B1E' },
  unitText: { fontSize: 10, color: '#5B6B5D' },
  label: { marginTop: 6, fontSize: 13, fontWeight: '500', color: '#1C2B1E' },
  subLabel: { fontSize: 11, color: '#5B6B5D', marginTop: 2 },
});
