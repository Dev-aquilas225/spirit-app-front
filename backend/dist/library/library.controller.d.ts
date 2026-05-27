import { LibraryService } from './library.service';
export declare class LibraryController {
    private svc;
    constructor(svc: LibraryService);
    getAll(): Promise<import("./library.entity").LibraryEntity[]>;
    getAllAdmin(): Promise<import("./library.entity").LibraryEntity[]>;
    getOne(id: string): Promise<import("./library.entity").LibraryEntity>;
    create(body: any): Promise<import("./library.entity").LibraryEntity[]>;
    update(id: string, body: any): Promise<import("./library.entity").LibraryEntity>;
    delete(id: string): Promise<void>;
    updateStatus(id: string, body: {
        status: string;
    }): Promise<import("./library.entity").LibraryEntity>;
}
