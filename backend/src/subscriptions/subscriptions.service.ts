import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SubscriptionsEntity } from './subscriptions.entity';
import { UsersService } from '../users/users.service';
import axios from 'axios';

// Plans synchronisés avec le frontend (payment.service.ts)
const PLANS = [
  { id: 'weekly_plus', name: 'Offre Hebdomadaire', price: 3000,  currency: 'XOF', credits: 5000,  durationDays: 7  },
  { id: 'monthly',     name: 'Offre Mensuelle',    price: 8000,  currency: 'XOF', credits: 20000, durationDays: 30 },
];

@Injectable()
export class SubscriptionsService {
  constructor(
    @InjectRepository(SubscriptionsEntity) private repo: Repository<SubscriptionsEntity>,
    private users: UsersService,
  ) {}

  getPlans() { return PLANS; }

  async initiate(userId: string, plan: string, autoRenew = false) {
    const planInfo = PLANS.find(p => p.id === plan);
    if (!planInfo) throw new Error('Plan invalide');
    const reference = 'OP-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7).toUpperCase();
    const sub = this.repo.create({
      userId,
      plan,
      reference,
      status: 'pending',
      autoRenew,
      credits: planInfo.credits,
      amount: planInfo.price,
    });
    await this.repo.save(sub);
    // Initier le paiement Paystack
    const paystackKey = process.env.PAYSTACK_SECRET_KEY;
    const callbackUrl = process.env.PAYSTACK_CALLBACK_URL || 'https://oracle-plus.online/subscription/callback';
    if (paystackKey) {
      try {
        const user = await this.users.findById(userId);
        const res = await axios.post('https://api.paystack.co/transaction/initialize', {
          email: user?.email || 'user@oracle-plus.online',
          amount: planInfo.price * 100, // en centimes
          reference,
          callback_url: callbackUrl,
          metadata: { userId, plan, credits: planInfo.credits },
        }, { headers: { Authorization: `Bearer ${paystackKey}` } });
        return { reference, paymentUrl: res.data.data.authorization_url, plan: planInfo };
      } catch (e: any) {
        console.error('[Paystack] initiate error:', e.message);
      }
    }
    return { reference, paymentUrl: null, plan: planInfo };
  }

  async activate(id: string) {
    const sub = await this.repo.findOne({ where: { id } });
    if (!sub) return;
    const planInfo = PLANS.find(p => p.id === sub.plan);
    const durationDays = planInfo?.durationDays ?? 30;
    const expiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);
    await this.repo.update(id, { status: 'active', activatedAt: new Date(), expiresAt });
    // Créditer l'utilisateur
    if (sub.credits) await this.users.addCredits(sub.userId, sub.credits);
    // Mettre à jour le statut abonnement de l'utilisateur
    await this.users.update(sub.userId, { subscriptionStatus: 'active' });
  }

  async verify(reference: string) {
    const sub = await this.repo.findOne({ where: { reference } });
    if (!sub) return { success: false, verified: false, message: 'Référence introuvable' };
    const paystackKey = process.env.PAYSTACK_SECRET_KEY;
    if (paystackKey) {
      try {
        const res = await axios.get(`https://api.paystack.co/transaction/verify/${reference}`, {
          headers: { Authorization: `Bearer ${paystackKey}` },
        });
        if (res.data?.data?.status === 'success') {
          await this.activate(sub.id);
          const updated = await this.repo.findOne({ where: { id: sub.id } });
          return { success: true, verified: true, subscription: updated };
        }
      } catch (e: any) {
        console.error('[Paystack] verify error:', e.message);
      }
    }
    // Retourner le statut actuel si Paystack indisponible
    return {
      success: sub.status === 'active',
      verified: sub.status === 'active',
      subscription: sub,
    };
  }

  async getStatus(reference: string) {
    const sub = await this.repo.findOne({ where: { reference } });
    if (!sub) return { status: 'pending' };
    return { status: sub.status, subscription: sub };
  }

  getAll() { return this.repo.find({ order: { createdAt: 'DESC' } }); }
}

  async getMySubscription(userId: string) {
    return this.repo.findOne({
      where: { userId, status: 'active' },
      order: { createdAt: 'DESC' },
    });
  }

  async getHistory(userId: string) {
    return this.repo.find({ where: { userId }, order: { createdAt: 'DESC' } });
  }

  async cancel(userId: string) {
    const sub = await this.repo.findOne({ where: { userId, status: 'active' } });
    if (!sub) return { success: false, message: 'Aucun abonnement actif' };
    await this.repo.update(sub.id, { status: 'cancelled', autoRenew: false });
    await this.users.update(userId, { subscriptionStatus: 'inactive' });
    return { success: true, message: 'Abonnement annulé' };
  }
}
