import React from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { colors, radius, type } from '../theme';

interface Props extends TextInputProps {
  label: string;
  error?: string;
  suffix?: string;
}

export function Field({ label, error, suffix, style, ...rest }: Props) {
  return (
    <View style={{ gap: 6, flex: 1 }}>
      <Text style={type.small}>{label}</Text>
      <View style={[styles.box, error ? { borderColor: colors.danger } : null]}>
        <TextInput
          placeholderTextColor="#A3ADA7"
          style={[styles.input, style]}
          {...rest}
        />
        {suffix ? <Text style={type.small}>{suffix}</Text> : null}
      </View>
      {error ? <Text style={{ color: colors.danger, fontSize: 12 }}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    height: 50,
  },
  input: { flex: 1, fontSize: 16, color: colors.ink },
});
