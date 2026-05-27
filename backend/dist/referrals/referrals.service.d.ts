import { Repository } from 'typeorm';
import { ReferralsEntity } from './referrals.entity';
import { UsersService } from '../users/users.service';
export declare class ReferralsService {
    private repo;
    private users;
    constructor(repo: Repository<ReferralsEntity>, users: UsersService);
    getMyReferrals(userId: string): Promise<{
        count: number;
        referrals: ReferralsEntity[];
    }>;
    getShareLink(userId: string): Promise<{
        code: string;
        message: string;
    }>;
}
