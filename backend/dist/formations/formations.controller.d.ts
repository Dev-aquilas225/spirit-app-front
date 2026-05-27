import { FormationsService } from './formations.service';
export declare class FormationsController {
    private svc;
    constructor(svc: FormationsService);
    getAll(): Promise<import("./formations.entity").FormationsEntity[]>;
    getAllAdmin(): Promise<import("./formations.entity").FormationsEntity[]>;
    getProgress(req: any): any[];
    getOne(id: string): Promise<import("./formations.entity").FormationsEntity>;
    getLesson(id: string, lid: string): Promise<any>;
    addProgress(req: any, id: string, body: any): Promise<{
        success: boolean;
    }>;
    create(body: any): Promise<import("./formations.entity").FormationsEntity[]>;
    addLesson(id: string, body: any): Promise<import("./formations.entity").FormationsEntity>;
    update(id: string, body: any): Promise<import("./formations.entity").FormationsEntity>;
    delete(id: string): Promise<void>;
}
