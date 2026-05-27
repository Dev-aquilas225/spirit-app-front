import { Repository } from 'typeorm';
import { SupportEntity } from './support.entity';
export declare class SupportService {
    private repo;
    constructor(repo: Repository<SupportEntity>);
    create(userId: string, data: any): Promise<SupportEntity[]>;
    getMyTickets(userId: string): Promise<SupportEntity[]>;
}
