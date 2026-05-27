import { PrayersService } from './prayers.service';
export declare class PrayersController {
    private svc;
    constructor(svc: PrayersService);
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
    getAll(req: any): Promise<import("./prayers.entity").PrayersEntity[]>;
    getOne(req: any, id: string): Promise<import("./prayers.entity").PrayersEntity>;
    create(req: any, body: any): Promise<import("./prayers.entity").PrayersEntity[]>;
    getPrograms(req: any): Promise<import("./prayers.entity").PrayersEntity[]>;
    createProgram(req: any, body: any): Promise<import("./prayers.entity").PrayersEntity[]>;
    deleteProgram(req: any, id: string): Promise<void>;
}
