import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PrayersEntity } from './prayers.entity';

const MORNING = 'Seigneur, en ce nouveau matin, je Te rends grâce pour la vie. Guide mes pas aujourd\'hui et que Ta volonté soit faite. Amen.';
const EVENING = 'Père céleste, merci pour cette journée. Protège-moi cette nuit et renouvelle mes forces. Amen.';

@Injectable()
export class PrayersService {
  constructor(@InjectRepository(PrayersEntity) private repo: Repository<PrayersEntity>) {}

  getDaily() { return { morning: { type: 'morning', content: MORNING }, evening: { type: 'evening', content: EVENING } }; }
  getDailyByDate(date: string) { return { morning: { type: 'morning', content: MORNING, date }, evening: { type: 'evening', content: EVENING, date } }; }
  getAll(userId: string) { return this.repo.find({ where: { userId }, order: { createdAt: 'DESC' } }); }
  getOne(userId: string, id: string) { return this.repo.findOne({ where: { id, userId } }); }
  async create(userId: string, data: any) { return this.repo.save(this.repo.create({ ...data, userId })); }
  getPrograms(userId: string) { return this.repo.find({ where: { userId, type: 'program' }, order: { createdAt: 'DESC' } }); }
  async createProgram(userId: string, data: any) { return this.repo.save(this.repo.create({ ...data, userId, type: 'program' })); }
  async deleteProgram(userId: string, id: string) { await this.repo.delete({ id, userId }); }
}
