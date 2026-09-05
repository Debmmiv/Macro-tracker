import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, Path, G } from 'react-native-svg';

interface Props {
  size?: number;
  showText?: boolean;
}

export default function NutriTrackLogo({ size = 56, showText = true }: Props) {
  return (
    <View style={styles.container}>
      {/* Icon */}
      <View style={[styles.iconCircle, { width: size, height: size, borderRadius: size / 2 }]}>
        <Svg width={size * 0.6} height={size * 0.6} viewBox="0 0 24 24">
          {/* Leaf shape */}
          <Path
            d="M17 8C8 10 5.9 16.17 3.82 19.34L5.71 21l1-1C7 19.35 7 19 8 18c0 0 4 0 6-4 0 0 2.09 3.41 2 6l2.09.91C19.19 17.5 21 14.5 21 11c0-5-4-3-4-3z"
            fill="white"
          />
          {/* Small progress arc dots */}
          <Circle cx="7" cy="12" r="1.2" fill="rgba(255,255,255,0.6)" />
          <Circle cx="5" cy="15" r="1" fill="rgba(255,255,255,0.4)" />
        </Svg>
      </View>

      {/* Text */}
      {showText && (
        <View style={styles.textContainer}>
          <Text style={styles.brandName}>NutriTrack</Text>
          <Text style={styles.tagline}>Smart macro tracking</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', gap: 10 },
  iconCircle: {
    backgroundColor: '#49a43b',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#49a43b',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  textContainer: { alignItems: 'center' },
  brandName: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1C2B1E',
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 13,
    color: '#6B7F6D',
    marginTop: 2,
  },
});
