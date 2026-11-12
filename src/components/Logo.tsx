import React from 'react';
import { Image, ImageStyle, StyleProp } from 'react-native';

const source = require('../../assets/logo-mark.png');

export function Logo({ size = 72, style }: { size?: number; style?: StyleProp<ImageStyle> }) {
  return (
    <Image
      source={source}
      style={[{ width: size, height: size }, style]}
      resizeMode="contain"
      accessible
      accessibilityLabel="MacroTrack logo"
    />
  );
}
