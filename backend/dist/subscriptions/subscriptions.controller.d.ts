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
    getMe(req: any): any;
    getHistory(req: any): any;
    initiate(req: any, body: {
        plan: string;
        autoRenew: boolean;
    }): Promise<{
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
    verify(ref: string): Promise<{
        success: boolean;
        verified: boolean;
        message: string;
        subscription?: undefined;
    } | {
        success: boolean;
        verified: boolean;
        subscription: import("./subscriptions.entity").SubscriptionsEntity;
        message?: undefined;
    }>;
    getStatus(ref: string): Promise<{
        status: string;
        subscription?: undefined;
    } | {
        status: string;
        subscription: import("./subscriptions.entity").SubscriptionsEntity;
    }>;
    cancel(req: any): any;
    getAll(): Promise<import("./subscriptions.entity").SubscriptionsEntity[]>;
    activate(id: string): Promise<void>;
}
