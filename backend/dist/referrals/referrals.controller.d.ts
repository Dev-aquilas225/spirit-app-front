import { ReferralsService } from './referrals.service';
export declare class ReferralsController {
    private svc;
    constructor(svc: ReferralsService);
    getMyReferrals(req: any): Promise<{
        count: number;
        referrals: import("./referrals.entity").ReferralsEntity[];
    }>;
    getShareLink(req: any): Promise<{
        code: string;
        message: string;
    }>;
}
