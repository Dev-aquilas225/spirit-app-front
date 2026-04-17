// App
export const APP_NAME = 'Oracle Plus';
export const APP_VERSION = '1.0.0';

// Subscription
export const SUBSCRIPTION_PRICE = 5000;
export const SUBSCRIPTION_CURRENCY = 'FCFA';
export const SUBSCRIPTION_PERIOD_DAYS = 30;

// Guide spirituel — limite de questions par jour pour les utilisateurs gratuits
// Au-delà : message automatique + invitation à s'abonner
export const FREE_AI_DAILY_LIMIT = 5;
export const FREE_AI_MESSAGE_LIMIT = 5;
export const FREE_PRAYER_LIMIT = 3;

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
