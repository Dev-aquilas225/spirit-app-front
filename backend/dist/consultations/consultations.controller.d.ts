import { ConsultationsService } from './consultations.service';
export declare class ConsultationsController {
    private svc;
    constructor(svc: ConsultationsService);
    create(req: any, body: any): Promise<import("./consultations.entity").ConsultationsEntity[]>;
    getAll(req: any): Promise<import("./consultations.entity").ConsultationsEntity[]>;
    getOne(req: any, id: string): Promise<import("./consultations.entity").ConsultationsEntity>;
}
