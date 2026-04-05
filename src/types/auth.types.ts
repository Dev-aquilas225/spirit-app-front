export type UserRole = 'free' | 'subscriber';
export type Language = 'fr' | 'en' | 'ar';

export interface User {
  id: string;
  name: string;
  phone: string;
  country: string;
  language: Language;
  role: UserRole;
  avatar?: string;
  createdAt: string;
  referralCode: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
}

export interface LoginCredentials {
  phone: string;
  pin: string;
}

export interface RegisterData {
  name: string;
  phone: string;
  country: string;
  language: Language;
  pin: string;
}

export interface OTPData {
  phone: string;
  otp: string;
}
