/**
 * ScreenHeader — Header avec safe area automatique (iOS notch + Android status bar)
 * Remplace paddingTop: 56 hardcodé dans toutes les pages.
 */
import React from 'react';
import { Platform, StyleSheet, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface Props {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  backgroundColor?: string;
}

export function ScreenHeader({ children, style, backgroundColor }: Props) {
  const insets = useSafeAreaInsets();
  // iOS : respecter le notch. Android : status bar (24dp standard).
  const topPad = Platform.select({
    ios:     insets.top + 8,
    android: insets.top + 8,
    default: 16,
  });

  return (
    <View style={[
      st.base,
      { paddingTop: topPad, backgroundColor: backgroundColor ?? 'transparent' },
      style,
    ]}>
      {children}
    </View>
  );
}

const st = StyleSheet.create({
  base: {
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
});
