import { Repository } from 'typeorm';
import { FormationsEntity } from './formations.entity';
export declare class FormationsService {
    private repo;
    constructor(repo: Repository<FormationsEntity>);
    getAll(): Promise<FormationsEntity[]>;
    getAllAdmin(): Promise<FormationsEntity[]>;
    getOne(id: string): Promise<FormationsEntity>;
    getLesson(formationId: string, lessonId: string): Promise<any>;
    getProgress(userId: string): any[];
    addProgress(userId: string, formationId: string, lessonId: string): Promise<{
        success: boolean;
    }>;
    create(data: any): Promise<FormationsEntity[]>;
    addLesson(formationId: string, data: any): Promise<FormationsEntity>;
    update(id: string, data: any): Promise<FormationsEntity>;
    delete(id: string): Promise<void>;
}
