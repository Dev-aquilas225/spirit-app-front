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

// ── Thème CLAIR — fond blanc pur, textes foncés, accents or profond ───────────
export const lightColors = {
  background:        '#FFFFFF',
  surface:           '#F7F4EE',
  surfaceSecondary:  '#EEE8D8',
  card:              '#FFFFFF',
  border:            '#D4C49A',
  borderLight:       'rgba(180,150,80,0.25)',
  deepBlue:          palette.navy,

  text:              '#0A0F1E',
  textSecondary:     '#2C3E60',
  textTertiary:      '#4A6080',
  textInverse:       '#FFFFFF',
  textOnPurple:      '#FFFFFF',

  primary:           '#7A5818',
  primaryLight:      '#C9A84C',
  primaryDark:       '#5A3E0E',
  primaryPale:       'rgba(122,88,24,0.10)',

  accent:            '#0B1628',
  accentLight:       '#1E3A5F',

  tabBar:            '#FFFFFF',
  tabBarBorder:      '#D4C49A',
  tabBarActive:      '#7A5818',
  tabBarInactive:    '#4A6080',

  header:            '#FFFFFF',
  headerText:        '#0A0F1E',

  premium:           '#7A5818',
  premiumBackground: 'rgba(122,88,24,0.08)',
  premiumBorder:     '#C9A84C',

  buttonPrimary:     '#7A5818',
  buttonPrimaryText: '#FFFFFF',
  buttonSecondary:   '#0A0F1E',
  buttonSecondaryText: '#FFFFFF',
  buttonOutline:     '#7A5818',
  buttonOutlineText: '#7A5818',
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
