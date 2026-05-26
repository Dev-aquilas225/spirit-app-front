/**
 * Palette Oracle Plus
 * Bleu nuit profond · Or sacré · Blanc doré
 */
export const palette = {
  // Or sacré
  gold:        '#C9A84C',
  goldLight:   '#E8C96A',
  goldDark:    '#9A7228',
  goldPale:    'rgba(201,168,76,0.12)',
  goldGlow:    'rgba(201,168,76,0.30)',

  // Bleu nuit
  navy:        '#0B1628',
  navyMid:     '#112240',
  navyCard:    '#162B4A',
  navySoft:    '#1E3A5F',
  navyBorder:  'rgba(201,168,76,0.15)',

  // Blanc doré
  cream:       '#FDF8EE',
  creamSoft:   '#F5EDD8',
  creamFaint:  'rgba(253,248,238,0.70)',
  creamGhost:  'rgba(253,248,238,0.35)',

  // Sémantique
  success:     '#10B981',
  error:       '#EF4444',
  warning:     '#F59E0B',
  info:        '#3B82F6',

  transparent: 'transparent',
  overlay:     'rgba(0,0,0,0.65)',
};

// ── Thème CLAIR (bleu foncé sur fond blanc doré) ──────────────────────────────
export const lightColors = {
  background:        '#F8F3E8',
  surface:           '#FFFFFF',
  surfaceSecondary:  '#FDF8EE',
  card:              '#FFFFFF',
  border:            '#E2D5B8',
  borderLight:       'rgba(226,213,184,0.5)',
  deepBlue:          palette.navy,

  text:              '#0B1628',
  textSecondary:     '#1E3A5F',
  textTertiary:      '#5A7A9A',
  textInverse:       '#FFFFFF',
  textOnPurple:      '#FFFFFF',

  primary:           '#9A7228',
  primaryLight:      '#C9A84C',
  primaryDark:       '#7A5818',
  primaryPale:       'rgba(154,114,40,0.10)',

  accent:            '#112240',
  accentLight:       '#1E3A5F',

  tabBar:            '#FFFFFF',
  tabBarBorder:      '#E2D5B8',
  tabBarActive:      '#9A7228',
  tabBarInactive:    '#5A7A9A',

  header:            '#FFFFFF',
  headerText:        '#0B1628',

  premium:           '#9A7228',
  premiumBackground: 'rgba(154,114,40,0.08)',
  premiumBorder:     '#C9A84C',

  buttonPrimary:     '#9A7228',
  buttonPrimaryText: '#FFFFFF',
  buttonSecondary:   '#0B1628',
  buttonSecondaryText: '#FFFFFF',
  buttonOutline:     '#9A7228',
  buttonOutlineText: '#9A7228',
};

// ── Thème SOMBRE (bleu nuit + or + blanc doré) ────────────────────────────────
export const darkColors = {
  background:        palette.navy,
  surface:           palette.navyCard,
  surfaceSecondary:  palette.navyMid,
  card:              palette.navyCard,
  border:            palette.navyBorder,
  borderLight:       'rgba(201,168,76,0.08)',
  deepBlue:          palette.navyMid,

  text:              palette.cream,
  textSecondary:     palette.creamFaint,
  textTertiary:      palette.creamGhost,
  textInverse:       palette.navy,
  textOnPurple:      palette.cream,

  primary:           palette.gold,
  primaryLight:      palette.goldLight,
  primaryDark:       palette.goldDark,
  primaryPale:       palette.goldPale,

  accent:            '#60A5FA',
  accentLight:       '#93C5FD',

  tabBar:            palette.navyMid,
  tabBarBorder:      palette.navyBorder,
  tabBarActive:      palette.gold,
  tabBarInactive:    palette.creamGhost,

  header:            palette.navyMid,
  headerText:        palette.cream,

  premium:           palette.gold,
  premiumBackground: palette.goldPale,
  premiumBorder:     palette.goldDark,

  buttonPrimary:     palette.gold,
  buttonPrimaryText: palette.navy,
  buttonSecondary:   palette.cream,
  buttonSecondaryText: palette.navy,
  buttonOutline:     palette.gold,
  buttonOutlineText: palette.gold,
};

export type ColorScheme = typeof darkColors;
