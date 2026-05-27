import { ViralSharesService } from './viral-shares.service';
export declare class ViralSharesController {
    private svc;
    constructor(svc: ViralSharesService);
    create(req: any, body: any): Promise<import("./viral-shares.entity").ViralSharesEntity[]>;
    getMyShares(req: any): Promise<import("./viral-shares.entity").ViralSharesEntity[]>;
    getPending(): Promise<import("./viral-shares.entity").ViralSharesEntity[]>;
    getStats(): Promise<number>;
    approve(id: string): Promise<{
        message: string;
    }>;
    reject(id: string): Promise<{
        message: string;
    }>;
}
