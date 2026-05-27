import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SubscriptionsEntity } from './subscriptions.entity';
import { UsersService } from '../users/users.service';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

const PLANS = [
  { id: 'monthly', name: 'Mensuel', price: 2000, currency: 'XOF', credits: 10000, durationDays: 30 },
  { id: 'yearly',  name: 'Annuel',  price: 15000, currency: 'XOF', credits: 150000, durationDays: 365 },
];

@Injectable()
export class SubscriptionsService {
  constructor(
    @InjectRepository(SubscriptionsEntity) private repo: Repository<SubscriptionsEntity>,
    private users: UsersService,
  ) {}

  getPlans() { return PLANS; }

  async getMySubscription(userId: string) {
    const sub = await this.repo.findOne({ where: { userId, status: 'active' }, order: { createdAt: 'DESC' } });
    return { isActive: !!sub, subscription: sub };
  }

  async getHistory(userId: string) {
    return this.repo.find({ where: { userId }, order: { createdAt: 'DESC' } });
  }

  async initiate(userId: string, plan: string, autoRenew: boolean) {
    const user = await this.users.findById(userId);
    const planInfo = PLANS.find(p => p.id === plan) || PLANS[0];
    const reference = `OP-${uuidv4().slice(0, 8).toUpperCase()}`;
    const sub = await this.repo.save(this.repo.create({ userId, plan, status: 'pending', reference, autoRenew }));
    const paystackKey = process.env.PAYSTACK_SECRET_KEY;
    if (paystackKey) {
      try {
        const res = await axios.post('https://api.paystack.co/transaction/initialize', {
          email: user.email,
          amount: planInfo.price * 100,
          reference,
          callback_url: `${process.env.APP_BASE_URL}/subscription/callback`,
          currency: 'NGN',
        }, { headers: { Authorization: `Bearer ${paystackKey}` } });
        return { reference, paymentUrl: res.data.data.authorization_url, subscriptionId: sub.id };
      } catch {}
    }
    return { reference, paymentUrl: `${process.env.APP_BASE_URL}/subscription/callback?reference=${reference}`, subscriptionId: sub.id };
  }

  async verify(reference: string) {
    const sub = await this.repo.findOne({ where: { reference } });
    if (!sub) return { verified: false };
    const paystackKey = process.env.PAYSTACK_SECRET_KEY;
    if (paystackKey) {
      try {
        const res = await axios.get(`https://api.paystack.co/transaction/verify/${reference}`, {
          headers: { Authorization: `Bearer ${paystackKey}` },
        });
        if (res.data.data.status === 'success') {
          await this.activate(sub.id);
          return { verified: true, subscription: sub };
        }
      } catch {}
    }
    return { verified: false, subscription: sub };
  }

  async activate(subscriptionId: string) {
    const sub = await this.repo.findOne({ where: { id: subscriptionId } });
    if (!sub) return;
    const plan = PLANS.find(p => p.id === sub.plan) || PLANS[0];
    const expiresAt = new Date(Date.now() + plan.durationDays * 86400000);
    await this.repo.update(sub.id, { status: 'active', expiresAt });
    await this.users.update(sub.userId, { subscriptionStatus: 'active', role: 'subscriber' });
    await this.users.addCredits(sub.userId, plan.credits);
  }

  async cancel(userId: string) {
    await this.repo.update({ userId, status: 'active' }, { status: 'cancelled' });
    await this.users.update(userId, { subscriptionStatus: 'cancelled', role: 'free' });
  }

  getAll() { return this.repo.find({ order: { createdAt: 'DESC' } }); }
  getStatus(reference: string) { return this.repo.findOne({ where: { reference } }); }
}
