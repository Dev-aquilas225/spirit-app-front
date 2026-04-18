/**
 * FadeInView — enveloppe une vue avec une animation d'entrée douce.
 * Utilisé pour les écrans qui ne passent pas par ScreenWrapper (tabs, AI, etc.)
 */
import React from 'react';
import { ViewStyle } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

interface FadeInViewProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  delay?: number;
  duration?: number;
}

export function FadeInView({
  children,
  style,
  delay = 0,
  duration = 260,
}: FadeInViewProps) {
  return (
    <Animated.View
      entering={FadeIn.duration(duration).delay(delay)}
      style={[{ flex: 1 }, style]}
    >
      {children}
    </Animated.View>
  );
}
