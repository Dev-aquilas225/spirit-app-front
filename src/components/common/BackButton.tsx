import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import { router } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useTheme } from '../../theme';

interface BackButtonProps {
  onPress?: () => void;
  label?: string;
  variant?: 'dark' | 'light';
  style?: ViewStyle;
  disabled?: boolean;
}

export function BackButton({
  onPress,
  label = 'Retour',
  variant = 'light',
  style,
  disabled,
}: BackButtonProps) {
  const { colors } = useTheme();

  const isDark = variant === 'dark';
  const bg    = isDark ? 'rgba(255,255,255,0.15)' : (colors.primaryPale ?? '#EDE9FE');
  const color = isDark ? '#ffffff' : colors.primary;

  return (
    <TouchableOpacity
      onPress={onPress ?? (() => router.back())}
      disabled={disabled}
      activeOpacity={0.75}
      style={[styles.btn, { backgroundColor: bg }, style]}
    >
      <ChevronLeft size={18} color={color} strokeWidth={2.5} />
      <Text style={[styles.label, { color }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 2,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
});
