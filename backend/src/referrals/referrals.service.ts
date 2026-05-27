import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReferralsEntity } from './referrals.entity';
import { UsersService } from '../users/users.service';

@Injectable()
export class ReferralsService {
  constructor(
    @InjectRepository(ReferralsEntity) private repo: Repository<ReferralsEntity>,
    private users: UsersService,
  ) {}

  async getMyReferrals(userId: string) {
    const refs = await this.repo.find({ where: { referrerId: userId } });
    return { count: refs.length, referrals: refs };
  }

  async getShareLink(userId: string) {
    const user = await this.users.findById(userId);
    return { code: user.referralCode, message: `Partagez ce code: ${user.referralCode}` };
  }
}
