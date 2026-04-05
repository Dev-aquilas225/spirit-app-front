export const palette = {
  // Brand — Violet / Blanc / Noir
  purple: '#7C3AED',        // violet principal
  purpleLight: '#A78BFA',   // violet clair (hover, accents doux)
  purpleDark: '#5B21B6',    // violet foncé (pressed, headers)
  purplePale: '#EDE9FE',    // violet très pâle (backgrounds chips, badges)
  purpleMid: '#8B5CF6',     // violet medium

  black: '#0A0A0A',         // noir profond
  blackSoft: '#1A1A1A',     // noir texte principal
  blackMid: '#2D2D2D',      // noir secondaire

  white: '#FFFFFF',
  offWhite: '#FAFAFA',      // fond principal (quasi-blanc)
  whiteSmoke: '#F5F5F5',    // surface légèrement grisée

  // Gris neutres
  gray50: '#F9FAFB',
  gray100: '#F3F4F6',
  gray200: '#E5E7EB',
  gray300: '#D1D5DB',
  gray400: '#9CA3AF',
  gray500: '#6B7280',
  gray600: '#4B5563',
  gray700: '#374151',
  gray800: '#1F2937',
  gray900: '#111827',

  // Semantic
  success: '#10B981',
  successLight: '#D1FAE5',
  error: '#EF4444',
  errorLight: '#FEE2E2',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  info: '#3B82F6',
  infoLight: '#DBEAFE',

  // Utilitaires
  transparent: 'transparent',
  overlay: 'rgba(0, 0, 0, 0.5)',
  overlayLight: 'rgba(0, 0, 0, 0.15)',
  purpleOverlay: 'rgba(124, 58, 237, 0.1)',
};

export const lightColors = {
  // Fonds
  background: palette.offWhite,       // blanc cassé principal
  surface: palette.white,             // blanc pur (cards)
  surfaceSecondary: palette.whiteSmoke,
  card: palette.white,
  border: palette.gray200,
  borderLight: palette.gray100,
  deepBlue: '#1A1A3E',

  // Textes
  text: palette.blackSoft,            // noir principal
  textSecondary: palette.gray600,
  textTertiary: palette.gray400,
  textInverse: palette.white,
  textOnPurple: palette.white,

  // Brand
  primary: palette.purple,            // violet principal
  primaryLight: palette.purpleLight,
  primaryDark: palette.purpleDark,
  primaryPale: palette.purplePale,    // fond chips/badges violet pâle
  accent: palette.black,              // noir comme accent fort
  accentLight: palette.blackMid,

  // Tab bar
  tabBar: palette.white,
  tabBarBorder: palette.gray200,
  tabBarActive: palette.purple,
  tabBarInactive: palette.gray400,

  // Header
  header: palette.white,
  headerText: palette.blackSoft,

  // Premium (violet au lieu de gold)
  premium: palette.purple,
  premiumBackground: palette.purplePale,
  premiumBorder: palette.purpleLight,

  // Boutons
  buttonPrimary: palette.purple,
  buttonPrimaryText: palette.white,
  buttonSecondary: palette.black,
  buttonSecondaryText: palette.white,
  buttonOutline: palette.purple,
  buttonOutlineText: palette.purple,
};

export const darkColors = {
  // Fonds
  background: palette.blackSoft,
  surface: palette.blackMid,
  surfaceSecondary: '#3A3A3A',
  card: '#252525',
  border: '#3D3D3D',
  borderLight: '#333333',
  deepBlue: '#1A1A3E',

  // Textes
  text: palette.white,
  textSecondary: '#CCCCCC',
  textTertiary: '#888888',
  textInverse: palette.blackSoft,
  textOnPurple: palette.white,

  // Brand
  primary: palette.purpleMid,
  primaryLight: palette.purpleLight,
  primaryDark: palette.purpleDark,
  primaryPale: '#2D1B69',
  accent: palette.white,
  accentLight: palette.gray200,

  // Tab bar
  tabBar: palette.black,
  tabBarBorder: '#2A2A2A',
  tabBarActive: palette.purpleLight,
  tabBarInactive: '#666666',

  // Header
  header: palette.black,
  headerText: palette.white,

  // Premium
  premium: palette.purpleLight,
  premiumBackground: '#1E0D4E',
  premiumBorder: palette.purpleDark,

  // Boutons
  buttonPrimary: palette.purpleMid,
  buttonPrimaryText: palette.white,
  buttonSecondary: palette.white,
  buttonSecondaryText: palette.black,
  buttonOutline: palette.purpleLight,
  buttonOutlineText: palette.purpleLight,
};

export type ColorScheme = typeof lightColors;
