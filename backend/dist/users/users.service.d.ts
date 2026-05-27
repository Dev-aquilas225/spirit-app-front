import { Repository } from 'typeorm';
import { User } from './user.entity';
export declare class UsersService {
    private repo;
    constructor(repo: Repository<User>);
    findById(id: string): Promise<User>;
    findByEmail(email: string): Promise<User>;
    findByGoogleId(googleId: string): Promise<User>;
    findByReferralCode(code: string): Promise<User>;
    create(data: Partial<User>): Promise<User>;
    update(id: string, data: Partial<User>): Promise<User>;
    addCredits(id: string, amount: number): Promise<void>;
    deductCredits(id: string, amount: number): Promise<boolean>;
    delete(id: string): Promise<void>;
}
