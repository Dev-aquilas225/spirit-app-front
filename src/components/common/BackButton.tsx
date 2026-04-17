import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import { router } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useI18n } from '../../i18n';
import { useTheme } from '../../theme';

interface BackButtonProps {
  onPress?: () => void;
  label?: string;
  variant?: 'dark' | 'light';
  style?: ViewStyle;
  disabled?: boolean;
  /** Route de repli si l'historique est vide (ex: après un refresh web) */
  fallback?: string;
}

export function BackButton({
  onPress,
  label,
  variant = 'light',
  style,
  disabled,
  fallback = '/(app)/(tabs)/home',
}: BackButtonProps) {
  const { colors } = useTheme();
  const { t } = useI18n();

  const isDark = variant === 'dark';
  const bg    = isDark ? 'rgba(255,255,255,0.15)' : (colors.primaryPale ?? '#EDE9FE');
  const color = isDark ? '#ffffff' : colors.primary;
  const resolvedLabel = label ?? t.common.back;

  function handleBack() {
    if (onPress) {
      onPress();
      return;
    }
    // Après un refresh web, le stack est vide — router.back() ne ferait rien
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace(fallback as any);
    }
  }

  return (
    <TouchableOpacity
      onPress={handleBack}
      disabled={disabled}
      activeOpacity={0.75}
      style={[styles.btn, { backgroundColor: bg }, style]}
    >
      <ChevronLeft size={18} color={color} strokeWidth={2.5} />
      <Text style={[styles.label, { color }]}>{resolvedLabel}</Text>
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
