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
    getMySubscription(userId: string): Promise<{
        isActive: boolean;
        subscription: SubscriptionsEntity;
    }>;
    getHistory(userId: string): Promise<SubscriptionsEntity[]>;
    initiate(userId: string, plan: string, autoRenew: boolean): Promise<{
        reference: string;
        paymentUrl: any;
        subscriptionId: string;
    }>;
    verify(reference: string): Promise<{
        verified: boolean;
        subscription?: undefined;
    } | {
        verified: boolean;
        subscription: SubscriptionsEntity;
    }>;
    activate(subscriptionId: string): Promise<void>;
    cancel(userId: string): Promise<void>;
    getAll(): Promise<SubscriptionsEntity[]>;
    getStatus(reference: string): Promise<SubscriptionsEntity>;
}
