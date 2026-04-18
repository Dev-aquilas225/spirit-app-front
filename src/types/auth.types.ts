export type UserRole = 'free' | 'subscriber' | 'admin' | 'user';
export type Language = 'fr' | 'en' | 'ar';
export type Gender = 'male' | 'female' | 'other';

export interface User {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  gender?: Gender;
  email: string;
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
  email: string;
}
