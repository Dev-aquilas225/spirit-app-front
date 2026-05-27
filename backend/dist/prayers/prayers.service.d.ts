import { Repository } from 'typeorm';
import { PrayersEntity } from './prayers.entity';
export declare class PrayersService {
    private repo;
    constructor(repo: Repository<PrayersEntity>);
    getDaily(): {
        morning: {
            type: string;
            content: string;
        };
        evening: {
            type: string;
            content: string;
        };
    };
    getDailyByDate(date: string): {
        morning: {
            type: string;
            content: string;
            date: string;
        };
        evening: {
            type: string;
            content: string;
            date: string;
        };
    };
    getAll(userId: string): Promise<PrayersEntity[]>;
    getOne(userId: string, id: string): Promise<PrayersEntity>;
    create(userId: string, data: any): Promise<PrayersEntity[]>;
    getPrograms(userId: string): Promise<PrayersEntity[]>;
    createProgram(userId: string, data: any): Promise<PrayersEntity[]>;
    deleteProgram(userId: string, id: string): Promise<void>;
}
