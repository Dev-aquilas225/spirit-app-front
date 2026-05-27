import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private repo: Repository<User>) {}

  findById(id: string) { return this.repo.findOne({ where: { id } }); }
  findByEmail(email: string) { return this.repo.findOne({ where: { email } }); }
  findByGoogleId(googleId: string) { return this.repo.findOne({ where: { googleId } }); }
  findByReferralCode(code: string) { return this.repo.findOne({ where: { referralCode: code } }); }
  findByMagicToken(token: string) { return this.repo.findOne({ where: { magicLinkToken: token } }); }

  async create(data: Partial<User>): Promise<User> {
    const user = this.repo.create({
      ...data,
      credits: 2000,
      role: 'free',
      referralCode: uuidv4().slice(0, 8).toUpperCase(),
    });
    return this.repo.save(user);
  }

  async update(id: string, data: Partial<User>): Promise<User> {
    await this.repo.update(id, data);
    return this.findById(id);
  }

  async addCredits(id: string, amount: number) {
    await this.repo.increment({ id }, 'credits', amount);
  }

  async deductCredits(id: string, amount: number): Promise<boolean> {
    const user = await this.findById(id);
    if (!user || user.credits < amount) return false;
    await this.repo.decrement({ id }, 'credits', amount);
    return true;
  }

  async delete(id: string) { await this.repo.delete(id); }
}
