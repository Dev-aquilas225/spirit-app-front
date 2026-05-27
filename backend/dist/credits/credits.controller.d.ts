import { UsersService } from '../users/users.service';
export declare class CreditsController {
    private users;
    constructor(users: UsersService);
    getCredits(req: any): Promise<{
        credits: number;
    }>;
    deduct(req: any, body: {
        amount: number;
        action: string;
    }): Promise<{
        success: boolean;
        message: string;
        credits?: undefined;
    } | {
        success: boolean;
        credits: number;
        message?: undefined;
    }>;
    add(req: any, body: {
        amount: number;
    }): Promise<{
        success: boolean;
        credits: number;
    }>;
}
