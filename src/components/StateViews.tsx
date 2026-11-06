import React from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { colors, type } from '../theme';
import { Button } from './Button';

export function Loading() {
  return (
    <View style={{ padding: 32, alignItems: 'center' }}>
      <ActivityIndicator color={colors.primary} />
    </View>
  );
}

export function ErrorView({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <View style={{ padding: 24, gap: 12, alignItems: 'center' }}>
      <Text style={[type.body, { color: colors.danger, textAlign: 'center' }]}>{message}</Text>
      {onRetry ? <Button title="Try again" variant="secondary" onPress={onRetry} /> : null}
    </View>
  );
}

export function Empty({ title, hint }: { title: string; hint?: string }) {
  return (
    <View style={{ padding: 24, gap: 4, alignItems: 'center' }}>
      <Text style={type.heading}>{title}</Text>
      {hint ? <Text style={[type.small, { textAlign: 'center' }]}>{hint}</Text> : null}
    </View>
  );
}
