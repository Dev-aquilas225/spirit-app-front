import { SupportService } from './support.service';
export declare class SupportController {
    private svc;
    constructor(svc: SupportService);
    create(req: any, body: any): Promise<import("./support.entity").SupportEntity[]>;
    getMyTickets(req: any): Promise<import("./support.entity").SupportEntity[]>;
}
