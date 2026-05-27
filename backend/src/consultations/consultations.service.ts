import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConsultationsEntity } from './consultations.entity';

@Injectable()
export class ConsultationsService {
  constructor(@InjectRepository(ConsultationsEntity) private repo: Repository<ConsultationsEntity>) {}
  create(userId: string, data: any) { return this.repo.save(this.repo.create({ ...data, userId })); }
  getAll(userId: string) { return this.repo.find({ where: { userId }, order: { createdAt: 'DESC' } }); }
  getOne(userId: string, id: string) { return this.repo.findOne({ where: { id, userId } }); }
}
