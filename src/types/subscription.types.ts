export type SubscriptionStatus = 'active' | 'expired' | 'cancelled' | 'none';
export type PaymentStatus = 'pending' | 'success' | 'failed';
export type PaymentMethod = 'card' | 'mobile_money' | 'orange_money' | 'mtn_money';

export interface Subscription {
  id: string;
  userId: string;
  status: SubscriptionStatus;
  startDate: string;
  expiryDate: string;
  amount: number;
  currency: 'FCFA';
  autoRenew: boolean;
}

export interface PaymentRecord {
  id: string;
  userId: string;
  amount: number;
  currency: 'FCFA';
  method: PaymentMethod;
  status: PaymentStatus;
  reference: string;
  createdAt: string;
  description: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  currency: 'FCFA';
  period: 'monthly';
  features: string[];
}

export interface SubscriptionState {
  subscription: Subscription | null;
  payments: PaymentRecord[];
  isLoading: boolean;
  isProcessingPayment: boolean;
}
