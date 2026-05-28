import { ReferralsService } from './referrals.service';
export declare class ReferralsController {
    private svc;
    constructor(svc: ReferralsService);
    getMyReferrals(req: any): Promise<{
        referralCode: string;
        code: string;
        count: number;
        referrals: {
            id: string;
            phone: string;
            joinedAt: Date;
            credited: boolean;
        }[];
    }>;
    getShareLink(req: any): Promise<{
        code: string;
        referralCode: string;
        message: string;
    }>;
    useCode(req: any, body: {
        code: string;
    }): Promise<{
        success: boolean;
        creditsAdded: number;
        message: string;
    }>;
}
