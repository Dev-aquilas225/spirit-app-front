import { Repository } from 'typeorm';
import { ViralSharesEntity } from './viral-shares.entity';
import { UsersService } from '../users/users.service';
export declare class ViralSharesService {
    private repo;
    private users;
    constructor(repo: Repository<ViralSharesEntity>, users: UsersService);
    create(userId: string, data: any): Promise<ViralSharesEntity[]>;
    getMyShares(userId: string): Promise<ViralSharesEntity[]>;
    getPending(): Promise<ViralSharesEntity[]>;
    getStats(): Promise<number>;
    approve(id: string): Promise<{
        message: string;
    }>;
    reject(id: string): Promise<{
        message: string;
    }>;
}
