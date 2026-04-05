import React from 'react';
import { View, StyleSheet, ViewStyle, TouchableOpacity } from 'react-native';
import { useTheme } from '../../theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  elevated?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export function Card({ children, style, onPress, elevated = false, padding = 'md' }: CardProps) {
  const { colors, borderRadius: br, spacing, shadows } = useTheme();

  const paddingMap = {
    none: 0,
    sm: spacing.sm,
    md: spacing.base,
    lg: spacing.xl,
  };

  const cardStyle: ViewStyle = {
    backgroundColor: colors.card,
    borderRadius: br.lg,
    padding: paddingMap[padding],
    borderWidth: 1,
    borderColor: colors.border,
    ...(elevated ? shadows.md : {}),
  };

  if (onPress) {
    return (
      <TouchableOpacity activeOpacity={0.85} onPress={onPress} style={[cardStyle, style]}>
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={[cardStyle, style]}>{children}</View>;
}

export function GoldCard({ children, style, onPress }: Omit<CardProps, 'elevated' | 'padding'>) {
  const { colors, borderRadius: br, spacing, shadows } = useTheme();

  const cardStyle: ViewStyle = {
    backgroundColor: colors.premiumBackground,
    borderRadius: br.lg,
    padding: spacing.base,
    borderWidth: 1.5,
    borderColor: colors.premiumBorder,
    ...shadows.gold,
  };

  if (onPress) {
    return (
      <TouchableOpacity activeOpacity={0.85} onPress={onPress} style={[cardStyle, style]}>
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={[cardStyle, style]}>{children}</View>;
}
