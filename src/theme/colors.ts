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

// ── Thème CLAIR — fond crème chaud, textes très foncés, accents or vif ────────
export const lightColors = {
  background:        '#FDF8F0',        // crème chaud — pas blanc pur
  surface:           '#FFFFFF',        // cartes blanches sur fond crème
  surfaceSecondary:  '#F0E8D4',        // surface secondaire légèrement dorée
  card:              '#FFFFFF',
  border:            '#C8A84A',        // bordure or visible
  borderLight:       'rgba(180,140,60,0.30)',
  deepBlue:          palette.navy,

  text:              '#0A0A0A',        // noir quasi-pur — très lisible
  textSecondary:     '#3A3020',        // brun foncé — lisible
  textTertiary:      '#6B5A3A',        // brun moyen
  textInverse:       '#FFFFFF',
  textOnPurple:      '#FFFFFF',

  primary:           '#8B6010',        // or foncé — boutons principaux
  primaryLight:      '#C9A84C',        // or clair
  primaryDark:       '#5A3E08',
  primaryPale:       'rgba(139,96,16,0.12)',

  accent:            '#1A0F00',        // brun très foncé
  accentLight:       '#3D2800',

  tabBar:            '#FFFFFF',
  tabBarBorder:      '#C8A84A',
  tabBarActive:      '#8B6010',
  tabBarInactive:    '#6B5A3A',

  header:            '#FDF8F0',
  headerText:        '#0A0A0A',

  premium:           '#8B6010',
  premiumBackground: 'rgba(139,96,16,0.10)',
  premiumBorder:     '#C9A84C',

  buttonPrimary:     '#8B6010',
  buttonPrimaryText: '#FFFFFF',
  buttonSecondary:   '#0A0A0A',
  buttonSecondaryText: '#FFFFFF',
  buttonOutline:     '#8B6010',
  buttonOutlineText: '#8B6010',
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
