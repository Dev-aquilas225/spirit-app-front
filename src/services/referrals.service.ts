import { http } from './http.client';

export interface Referral {
  id: string;
  phone: string;
  joinedAt: string;
}

export interface ReferralData {
  referralCode: string;
  code?: string;
  referrals: Referral[];
  totalCount?: number;
  count?: number;
}

export const ReferralsService = {
  async getMine(): Promise<ReferralData | null> {
    try {
      return await http.get<ReferralData>('/referrals/me');
    } catch {
      return null;
    }
  },

  async getShareMessage(): Promise<{ code: string; message: string } | null> {
    try {
      return await http.get<{ code: string; message: string }>('/referrals/share');
    } catch {
      return null;
    }
  },

  async useCode(code: string): Promise<{ success: boolean; creditsAdded?: number; message: string }> {
    return http.post('/referrals/use', { code: code.toUpperCase() });
  },
};
