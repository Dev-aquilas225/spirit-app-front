import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ViralSharesEntity } from './viral-shares.entity';
import { UsersService } from '../users/users.service';

@Injectable()
export class ViralSharesService {
  constructor(
    @InjectRepository(ViralSharesEntity) private repo: Repository<ViralSharesEntity>,
    private users: UsersService,
  ) {}

  async create(userId: string, data: any) {
    const today = new Date().toDateString();
    const todayShares = await this.repo.count({ where: { userId } });
    return this.repo.save(this.repo.create({ ...data, userId, status: 'pending' }));
  }

  getMyShares(userId: string) { return this.repo.find({ where: { userId }, order: { createdAt: 'DESC' } }); }
  getPending() { return this.repo.find({ where: { status: 'pending' }, order: { createdAt: 'DESC' } }); }
  getStats() { return this.repo.count(); }

  async approve(id: string) {
    const share = await this.repo.findOne({ where: { id } });
    if (!share) return;
    await this.repo.update(id, { status: 'approved' });
    await this.users.addCredits(share.userId, 1000);
    return { message: 'Approved, 1000 credits added' };
  }

  async reject(id: string) {
    await this.repo.update(id, { status: 'rejected' });
    return { message: 'Rejected' };
  }
}
