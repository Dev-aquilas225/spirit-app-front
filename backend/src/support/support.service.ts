import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SupportEntity } from './support.entity';

@Injectable()
export class SupportService {
  constructor(@InjectRepository(SupportEntity) private repo: Repository<SupportEntity>) {}
  create(userId: string, data: any) { return this.repo.save(this.repo.create({ ...data, userId })); }
  getMyTickets(userId: string) { return this.repo.find({ where: { userId }, order: { createdAt: 'DESC' } }); }
}
