import { Repository } from 'typeorm';
import { ReferralsEntity } from './referrals.entity';
import { UsersService } from '../users/users.service';
export declare class ReferralsService {
    private repo;
    private users;
    constructor(repo: Repository<ReferralsEntity>, users: UsersService);
    getMyReferrals(userId: string): Promise<{
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
    getShareLink(userId: string): Promise<{
        code: string;
        referralCode: string;
        message: string;
    }>;
    useCode(refereeId: string, code: string): Promise<{
        success: boolean;
        creditsAdded: number;
        message: string;
    }>;
}
