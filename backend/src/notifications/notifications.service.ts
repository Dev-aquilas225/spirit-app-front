import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationsEntity } from './notifications.entity';

@Injectable()
export class NotificationsService {
  constructor(@InjectRepository(NotificationsEntity) private repo: Repository<NotificationsEntity>) {}
  getAll(userId: string) { return this.repo.find({ where: { userId }, order: { createdAt: 'DESC' } }); }
  async markRead(userId: string, id: string) { await this.repo.update({ id, userId }, { isRead: true }); }
  async markAllRead(userId: string) { await this.repo.update({ userId }, { isRead: true }); }
  async delete(userId: string, id: string) { await this.repo.delete({ id, userId }); }
}
