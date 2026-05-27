import { SubscriptionsService } from './subscriptions.service';
export declare class SubscriptionsController {
    private svc;
    constructor(svc: SubscriptionsService);
    getPlans(): {
        id: string;
        name: string;
        price: number;
        currency: string;
        credits: number;
        durationDays: number;
    }[];
    getMe(req: any): Promise<{
        isActive: boolean;
        subscription: import("./subscriptions.entity").SubscriptionsEntity;
    }>;
    getHistory(req: any): Promise<import("./subscriptions.entity").SubscriptionsEntity[]>;
    initiate(req: any, body: {
        plan: string;
        autoRenew: boolean;
    }): Promise<{
        reference: string;
        paymentUrl: any;
        subscriptionId: string;
    }>;
    verify(ref: string): Promise<{
        verified: boolean;
        subscription?: undefined;
    } | {
        verified: boolean;
        subscription: import("./subscriptions.entity").SubscriptionsEntity;
    }>;
    getStatus(ref: string): Promise<import("./subscriptions.entity").SubscriptionsEntity>;
    cancel(req: any): Promise<void>;
    getAll(): Promise<import("./subscriptions.entity").SubscriptionsEntity[]>;
    activate(id: string): Promise<void>;
}
