import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, type } from '../theme';

interface Option<T extends string> {
  value: T;
  label: string;
  hint?: string;
}

interface Props<T extends string> {
  label?: string;
  options: Option<T>[];
  value: T | null;
  onChange: (v: T) => void;
  stacked?: boolean;
}

export function Chips<T extends string>({ label, options, value, onChange, stacked }: Props<T>) {
  return (
    <View style={{ gap: 6 }}>
      {label ? <Text style={type.small}>{label}</Text> : null}
      <View style={stacked ? { gap: 8 } : styles.row}>
        {options.map((o) => {
          const selected = o.value === value;
          return (
            <Pressable
              key={o.value}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              onPress={() => onChange(o.value)}
              style={[styles.chip, selected && styles.selected]}
            >
              <Text style={[styles.text, selected && { color: colors.primary, fontWeight: '600' }]}>{o.label}</Text>
              {o.hint ? <Text style={type.small}>{o.hint}</Text> : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.line,
  },
  selected: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  text: { fontSize: 15, color: colors.ink },
});
