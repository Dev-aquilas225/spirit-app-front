import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LibraryEntity } from './library.entity';

@Injectable()
export class LibraryService {
  constructor(@InjectRepository(LibraryEntity) private repo: Repository<LibraryEntity>) {}
  getAll(query?: any) { return this.repo.find({ where: { status: 'active' }, order: { createdAt: 'DESC' } }); }
  getAllAdmin() { return this.repo.find({ order: { createdAt: 'DESC' } }); }
  getOne(id: string) { return this.repo.findOne({ where: { id } }); }
  create(data: any) { return this.repo.save(this.repo.create(data)); }
  async update(id: string, data: any) { await this.repo.update(id, data); return this.getOne(id); }
  async delete(id: string) { await this.repo.delete(id); }
  async updateStatus(id: string, status: string) { await this.repo.update(id, { status }); return this.getOne(id); }
}
