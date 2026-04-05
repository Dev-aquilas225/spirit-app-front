import { useColorScheme } from 'react-native';
import { lightColors, darkColors, ColorScheme } from './colors';
import { typography, textStyles } from './typography';
import { spacing, borderRadius, shadows } from './spacing';
import { useThemeStore } from '../store/theme.store';

export { lightColors, darkColors, typography, textStyles, spacing, borderRadius, shadows };
export type { ColorScheme };

export function useTheme(): {
  colors: ColorScheme;
  typography: typeof typography;
  textStyles: typeof textStyles;
  spacing: typeof spacing;
  borderRadius: typeof borderRadius;
  shadows: typeof shadows;
  isDark: boolean;
  mode: 'light' | 'dark' | 'system';
} {
  const systemScheme = useColorScheme(); // 'light' | 'dark' | null — suit les préfs système
  const mode = useThemeStore((s) => s.mode);

  const isDark =
    mode === 'system'
      ? systemScheme === 'dark'
      : mode === 'dark';

  return {
    colors: isDark ? darkColors : lightColors,
    typography,
    textStyles,
    spacing,
    borderRadius,
    shadows,
    isDark,
    mode,
  };
}
