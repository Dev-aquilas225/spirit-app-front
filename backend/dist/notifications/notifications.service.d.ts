import { Repository } from 'typeorm';
import { NotificationsEntity } from './notifications.entity';
export declare class NotificationsService {
    private repo;
    constructor(repo: Repository<NotificationsEntity>);
    getAll(userId: string): Promise<NotificationsEntity[]>;
    markRead(userId: string, id: string): Promise<void>;
    markAllRead(userId: string): Promise<void>;
    delete(userId: string, id: string): Promise<void>;
}
