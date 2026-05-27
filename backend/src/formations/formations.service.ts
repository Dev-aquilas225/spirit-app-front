import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FormationsEntity } from './formations.entity';

@Injectable()
export class FormationsService {
  constructor(@InjectRepository(FormationsEntity) private repo: Repository<FormationsEntity>) {}
  getAll() { return this.repo.find({ where: { isActive: true }, order: { createdAt: 'DESC' } }); }
  getAllAdmin() { return this.repo.find({ order: { createdAt: 'DESC' } }); }
  getOne(id: string) { return this.repo.findOne({ where: { id } }); }
  getLesson(formationId: string, lessonId: string) { return this.getOne(formationId).then(f => f?.lessons?.find((l: any) => l.id === lessonId)); }
  getProgress(userId: string) { return []; }
  async addProgress(userId: string, formationId: string, lessonId: string) { return { success: true }; }
  create(data: any) { return this.repo.save(this.repo.create(data)); }
  addLesson(formationId: string, data: any) { return this.getOne(formationId); }
  async update(id: string, data: any) { await this.repo.update(id, data); return this.getOne(id); }
  async delete(id: string) { await this.repo.delete(id); }
}
