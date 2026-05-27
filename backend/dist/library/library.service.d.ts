import { Repository } from 'typeorm';
import { LibraryEntity } from './library.entity';
export declare class LibraryService {
    private repo;
    constructor(repo: Repository<LibraryEntity>);
    getAll(query?: any): Promise<LibraryEntity[]>;
    getAllAdmin(): Promise<LibraryEntity[]>;
    getOne(id: string): Promise<LibraryEntity>;
    create(data: any): Promise<LibraryEntity[]>;
    update(id: string, data: any): Promise<LibraryEntity>;
    delete(id: string): Promise<void>;
    updateStatus(id: string, status: string): Promise<LibraryEntity>;
}
