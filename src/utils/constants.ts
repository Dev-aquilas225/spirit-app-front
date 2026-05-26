// App
export const APP_NAME = 'Oracle Plus';
export const APP_VERSION = '2.0.0';

// ── Monétisation hybride ──────────────────────────────────────────────────────
export const INITIAL_CREDITS = 1200;          // crédits offerts à l'inscription
export const CREDITS_PER_FCFA = 2;            // 1000 FCFA = 2000 crédits
export const AUDIO_PREVIEW_WORDS = 100;       // mots gratuits pour l'aperçu audio
export const AUDIO_STANDARD_WORDS = 1000;     // mots pour l'audio standard (abonnés)

// Subscription plans (FCFA)
export const PLAN_WEEKLY_PRICE      = 1000;
export const PLAN_WEEKLY_PLUS_PRICE = 3000;
export const PLAN_MONTHLY_PRICE     = 8000;

// Legacy (kept for compatibility)
export const SUBSCRIPTION_PRICE = PLAN_MONTHLY_PRICE;
export const SUBSCRIPTION_CURRENCY = 'FCFA';
export const SUBSCRIPTION_PERIOD_DAYS = 30;

// AI — no hard daily limit; access controlled by credits or subscription
export const FREE_AI_DAILY_LIMIT = 999;
export const FREE_AI_MESSAGE_LIMIT = 999;
export const FREE_PRAYER_LIMIT = 999;

// Notification times (hours in local time)
export const NOTIFICATION_TIMES = [
  { hour: 6, minute: 0, label: 'Prière du matin' },
  { hour: 13, minute: 0, label: 'Message de midi' },
  { hour: 21, minute: 0, label: 'Prière du soir' },
];

// Storage keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: '@spirit/auth_token',
  USER: '@spirit/user',
  SUBSCRIPTION: '@spirit/subscription',
  AI_USAGE: '@spirit/ai_usage',
  AI_CONVERSATIONS: '@spirit/ai_conversations',
  PAYMENTS: '@spirit/payments',
  ONBOARDING_DONE: '@spirit/onboarding_done',
  THEME: '@spirit/theme',
  LANGUAGE: '@spirit/language',
  NOTIFICATIONS_ENABLED: '@spirit/notifications_enabled',
  NOTIFICATIONS_ASKED: '@spirit/notifications_asked',
  USER_GENDER: '@spirit/user_gender',
  PROFILE_COMPLETE: '@spirit/profile_complete',
};

// Mock payment delay (ms)
export const PAYMENT_PROCESSING_DELAY = 3000;

// Countries (subset)
export const COUNTRIES = [
  { code: 'CI', name: 'Côte d\'Ivoire', dialCode: '+225' },
  { code: 'SN', name: 'Sénégal',        dialCode: '+221' },
  { code: 'CM', name: 'Cameroun',       dialCode: '+237' },
  { code: 'BJ', name: 'Bénin',          dialCode: '+229' },
  { code: 'TG', name: 'Togo',           dialCode: '+228' },
  { code: 'BF', name: 'Burkina Faso',   dialCode: '+226' },
  { code: 'ML', name: 'Mali',           dialCode: '+223' },
  { code: 'GN', name: 'Guinée',         dialCode: '+224' },
  { code: 'CD', name: 'RD Congo',       dialCode: '+243' },
  { code: 'FR', name: 'France',         dialCode: '+33'  },
];

// Languages
export const LANGUAGES = [
  { code: 'fr', name: 'Français' },
  { code: 'en', name: 'English' },
  { code: 'ar', name: 'العربية' },
];

// Payment methods
export const PAYMENT_METHODS = [
  { id: 'orange_money', name: 'Orange Money' },
  { id: 'mtn_money', name: 'MTN Money' },
  { id: 'mobile_money', name: 'Mobile Money' },
  { id: 'card', name: 'Carte bancaire' },
] as const;
