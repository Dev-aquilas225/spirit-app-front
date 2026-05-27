import { UsersService } from './users.service';
export declare class UsersController {
    private svc;
    constructor(svc: UsersService);
    getMe(req: any): Promise<import("./user.entity").User>;
    updateMe(req: any, body: any): Promise<import("./user.entity").User>;
    deleteMe(req: any): Promise<{
        message: string;
    }>;
}
