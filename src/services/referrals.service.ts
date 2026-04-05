import { http } from './http.client';

export interface Referral {
  id: string;
  phone: string;
  joinedAt: string;
}

export interface ReferralData {
  referralCode: string;
  referrals: Referral[];
  totalCount: number;
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
};
