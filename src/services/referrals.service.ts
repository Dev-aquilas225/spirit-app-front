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

  // POST /referrals/share — utiliser le code d'un parrain
  async useCode(code: string): Promise<{ success: boolean; creditsAdded?: number; message: string }> {
    try {
      return await http.post('/referrals/share', { referralCode: code.toUpperCase() });
    } catch (e: any) {
      return { success: false, message: e?.message ?? 'Erreur parrainage' };
    }
  },
};
