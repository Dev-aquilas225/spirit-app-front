import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SubscriptionsEntity } from './subscriptions.entity';
import { UsersService } from '../users/users.service';
import axios from 'axios';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

const PLANS = [
  { id: 'weekly_plus', name: 'Offre Hebdomadaire', price: 3000,  currency: 'XOF', credits: 5000,  durationDays: 7  },
  { id: 'monthly',     name: 'Offre Mensuelle',    price: 8000,  currency: 'XOF', credits: 20000, durationDays: 30 },
];

@Injectable()
export class SubscriptionsService {
  private readonly logger = new Logger(SubscriptionsService.name);
  private readonly LOG_DIR = process.env.LOGS_PATH || '/tmp/logs';

  constructor(
    @InjectRepository(SubscriptionsEntity) private repo: Repository<SubscriptionsEntity>,
    private users: UsersService,
  ) {
    // Créer le dossier de logs au démarrage
    if (!fs.existsSync(this.LOG_DIR)) {
      fs.mkdirSync(this.LOG_DIR, { recursive: true });
    }
  }

  /** Écrit une ligne dans le fichier de log des transactions */
  private logTransaction(status: string, email: string, amount: number, reference: string) {
    const line = `[${new Date().toISOString()}] status=${status} email=${email} amount=${amount} ref=${reference}\n`;
    try {
      fs.appendFileSync(path.join(this.LOG_DIR, 'transactions.log'), line);
    } catch (e: any) {
      this.logger.warn('Log write failed: ' + e.message);
    }
    this.logger.log(`Transaction: ${status} | ${email} | ${amount} XOF | ${reference}`);
  }

  getPlans() { return PLANS; }

  async initiate(userId: string, plan: string, autoRenew = false) {
    const planInfo = PLANS.find(p => p.id === plan);
    if (!planInfo) throw new Error('Plan invalide');
    const reference = 'OP-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7).toUpperCase();
    const sub = this.repo.create({ userId, plan, reference, status: 'pending', autoRenew, credits: planInfo.credits, amount: planInfo.price });
    await this.repo.save(sub);
    const paystackKey = process.env.PAYSTACK_SECRET_KEY;
    const callbackUrl = process.env.PAYSTACK_CALLBACK_URL || 'https://oracle-plus.online/subscription/callback';
    if (paystackKey) {
      try {
        const user = await this.users.findById(userId);
        const res = await axios.post('https://api.paystack.co/transaction/initialize', {
          email: user?.email || 'user@oracle-plus.online',
          amount: planInfo.price * 100,
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
    if (sub.credits) await this.users.addCredits(sub.userId, sub.credits);
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
    return { success: sub.status === 'active', verified: sub.status === 'active', subscription: sub };
  }

  async getStatus(reference: string) {
    const sub = await this.repo.findOne({ where: { reference } });
    if (!sub) return { status: 'pending' };
    return { status: sub.status, subscription: sub };
  }

  async getMySubscription(userId: string) {
    return this.repo.findOne({ where: { userId, status: 'active' }, order: { createdAt: 'DESC' } });
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

  getAll() { return this.repo.find({ order: { createdAt: 'DESC' } }); }

  /**
   * Webhook Paystack — appelé automatiquement par Paystack après chaque paiement.
   * Vérifie la signature HMAC-SHA512, puis active l'abonnement si charge = success.
   */
  async handleWebhook(signature: string, body: any, rawBody?: Buffer) {
    const secret = process.env.PAYSTACK_WEBHOOK_SECRET;
    if (!secret) {
      this.logger.warn('PAYSTACK_WEBHOOK_SECRET manquant — webhook ignoré');
      return { received: true };
    }

    // Vérifier la signature Paystack
    if (signature && rawBody) {
      const expected = crypto
        .createHmac('sha512', secret)
        .update(rawBody)
        .digest('hex');
      if (signature !== expected) {
        this.logger.warn('Webhook Paystack : signature invalide');
        return { received: false, error: 'Invalid signature' };
      }
    }

    const event = body?.event;
    const data  = body?.data;

    if (event === 'charge.success') {
      const reference = data?.reference;
      const email     = data?.customer?.email ?? 'unknown';
      const amount    = (data?.amount ?? 0) / 100; // Paystack envoie en centimes

      this.logTransaction('SUCCESS', email, amount, reference);

      const sub = await this.repo.findOne({ where: { reference } });
      if (sub && sub.status !== 'active') {
        await this.activate(sub.id);
        this.logger.log(`Abonnement activé via webhook : ${reference}`);
      } else if (!sub) {
        this.logger.warn(`Webhook : référence inconnue ${reference}`);
      }
    } else if (event === 'charge.failed') {
      const reference = data?.reference ?? 'unknown';
      const email     = data?.customer?.email ?? 'unknown';
      const amount    = (data?.amount ?? 0) / 100;
      this.logTransaction('FAILED', email, amount, reference);
      await this.repo.update({ reference }, { status: 'failed' });
    }

    return { received: true };
  }
}
