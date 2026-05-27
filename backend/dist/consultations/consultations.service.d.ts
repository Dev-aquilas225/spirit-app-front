import { Repository } from 'typeorm';
import { ConsultationsEntity } from './consultations.entity';
export declare class ConsultationsService {
    private repo;
    constructor(repo: Repository<ConsultationsEntity>);
    create(userId: string, data: any): Promise<ConsultationsEntity[]>;
    getAll(userId: string): Promise<ConsultationsEntity[]>;
    getOne(userId: string, id: string): Promise<ConsultationsEntity>;
}
