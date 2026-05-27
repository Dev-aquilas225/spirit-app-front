import { NotificationsService } from './notifications.service';
export declare class NotificationsController {
    private svc;
    constructor(svc: NotificationsService);
    getAll(req: any): Promise<import("./notifications.entity").NotificationsEntity[]>;
    markRead(req: any, id: string): Promise<void>;
    markAllRead(req: any): Promise<void>;
    delete(req: any, id: string): Promise<void>;
}
