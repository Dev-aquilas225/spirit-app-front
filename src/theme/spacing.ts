import { Platform } from 'react-native';

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
  '5xl': 64,
};

export const borderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  full: 9999,
};

/**
 * Ombres cross-platform.
 * – Web  : boxShadow CSS (React Native Web 0.21+ / RN 0.83+)
 * – Native : shadowColor / elevation
 */
export const shadows = {
  sm: Platform.select({
    web:     { boxShadow: '0 1px 2px rgba(0,0,0,0.06)' },
    default: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 2, elevation: 1 },
  })!,
  md: Platform.select({
    web:     { boxShadow: '0 2px 8px rgba(0,0,0,0.10)' },
    default: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.10, shadowRadius: 4, elevation: 3 },
  })!,
  lg: Platform.select({
    web:     { boxShadow: '0 4px 16px rgba(0,0,0,0.14)' },
    default: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.14, shadowRadius: 8, elevation: 5 },
  })!,
  gold: Platform.select({
    web:     { boxShadow: '0 2px 10px rgba(124,58,237,0.22)' },
    default: { shadowColor: '#7C3AED', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.22, shadowRadius: 8, elevation: 4 },
  })!,
  purple: Platform.select({
    web:     { boxShadow: '0 4px 14px rgba(124,58,237,0.28)' },
    default: { shadowColor: '#7C3AED', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.28, shadowRadius: 10, elevation: 6 },
  })!,
};
