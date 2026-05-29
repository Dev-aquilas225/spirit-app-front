import { Repository } from 'typeorm';
import { SubscriptionsEntity } from './subscriptions.entity';
import { UsersService } from '../users/users.service';
export declare class SubscriptionsService {
    private repo;
    private users;
    constructor(repo: Repository<SubscriptionsEntity>, users: UsersService);
    getPlans(): {
        id: string;
        name: string;
        price: number;
        currency: string;
        credits: number;
        durationDays: number;
    }[];
    initiate(userId: string, plan: string, autoRenew?: boolean): Promise<{
        reference: string;
        paymentUrl: any;
        plan: {
            id: string;
            name: string;
            price: number;
            currency: string;
            credits: number;
            durationDays: number;
        };
    }>;
    activate(id: string): Promise<void>;
    verify(reference: string): Promise<{
        success: boolean;
        verified: boolean;
        message: string;
        subscription?: undefined;
    } | {
        success: boolean;
        verified: boolean;
        subscription: SubscriptionsEntity;
        message?: undefined;
    }>;
    getStatus(reference: string): Promise<{
        status: string;
        subscription?: undefined;
    } | {
        status: string;
        subscription: SubscriptionsEntity;
    }>;
    getAll(): Promise<SubscriptionsEntity[]>;
}
