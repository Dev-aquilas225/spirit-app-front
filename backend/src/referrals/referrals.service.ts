import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
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
    const user = await this.users.findById(userId);
    const refs = await this.repo.find({ where: { referrerId: userId } });
    const referrals = await Promise.all(
      refs.map(async (r) => {
        const referee = await this.users.findById(r.referredId);
        return { id: r.id, phone: referee?.email ?? '', joinedAt: r.createdAt, credited: r.credited };
      }),
    );
    return {
      referralCode: user?.referralCode ?? '',
      code: user?.referralCode ?? '',
      count: refs.length,
      referrals,
    };
  }

  async getShareLink(userId: string) {
    const user = await this.users.findById(userId);
    if (!user) throw new NotFoundException('User not found');
    return { code: user.referralCode, referralCode: user.referralCode, message: `Partagez ce code: ${user.referralCode}` };
  }

  async useCode(refereeId: string, code: string) {
    if (!code) throw new BadRequestException('Code requis');
    const referrer = await this.users.findByReferralCode(code.toUpperCase());
    if (!referrer) throw new NotFoundException('Code invalide');
    if (referrer.id === refereeId) throw new BadRequestException('Vous ne pouvez pas utiliser votre propre code');
    const existing = await this.repo.findOne({ where: { referredId: refereeId } });
    if (existing) throw new BadRequestException('Vous avez déjà utilisé un code de parrainage');
    await this.repo.save(this.repo.create({ referrerId: referrer.id, referredId: refereeId, credited: true }));
    await this.users.addCredits(referrer.id, 200);
    await this.users.addCredits(refereeId, 200);
    return { success: true, creditsAdded: 200, message: '200 crédits ajoutés à vous et votre parrain !' };
  }
}
