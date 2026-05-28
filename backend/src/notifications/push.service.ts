/**
 * PushService — Oracle Plus
 * Web Push VAPID avec cron automatique toutes les 5h.
 * Messages "curiosity gap" adaptés à l'heure de la journée.
 */
import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PushSubscriptionEntity } from './push-subscription.entity';
import { getScheduledMessage } from './push-messages';
import * as webpush from 'web-push';

@Injectable()
export class PushService implements OnModuleInit {
  private readonly logger = new Logger(PushService.name);
  private vapidReady = false;

  constructor(
    @InjectRepository(PushSubscriptionEntity)
    private repo: Repository<PushSubscriptionEntity>,
  ) {}

  onModuleInit() {
    this.initVapid();
    this.startCron();
  }

  private initVapid() {
    const pub = process.env.VAPID_PUBLIC_KEY;
    const priv = process.env.VAPID_PRIVATE_KEY;
    const email = process.env.VAPID_EMAIL || 'admin@oracle-plus.online';
    if (!pub || !priv) {
      this.logger.warn('VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY manquantes — push désactivé');
      return;
    }
    try {
      webpush.setVapidDetails(`mailto:${email}`, pub, priv);
      this.vapidReady = true;
      this.logger.log('VAPID initialisé');
    } catch (e: any) {
      this.logger.error('VAPID init échoué : ' + e.message);
    }
  }

  /** Cron toutes les 5h */
  private startCron() {
    const FIVE_HOURS = 5 * 60 * 60 * 1000;
    setInterval(async () => {
      this.logger.log('Cron push 5h : envoi notification automatique');
      try {
        const result = await this.sendScheduled();
        this.logger.log(`Cron push : ${result.sent} envoyés, ${result.failed} échoués`);
      } catch (e: any) {
        this.logger.error('Cron push erreur : ' + e.message);
      }
    }, FIVE_HOURS);
    this.logger.log('Cron push démarré (toutes les 5h)');
  }

  /** Enregistre ou met à jour une subscription navigateur */
  async subscribe(
    sub: { endpoint: string; keys: { p256dh: string; auth: string } },
    userId?: string,
  ) {
    const existing = await this.repo.findOne({ where: { endpoint: sub.endpoint } });
    if (existing) {
      await this.repo.update(existing.id, {
        p256dh: sub.keys.p256dh,
        auth: sub.keys.auth,
        ...(userId ? { userId } : {}),
      });
      return { ok: true, updated: true };
    }
    await this.repo.save(
      this.repo.create({
        endpoint: sub.endpoint,
        p256dh: sub.keys.p256dh,
        auth: sub.keys.auth,
        userId: userId ?? null,
      }),
    );
    return { ok: true, created: true };
  }

  /** Désabonnement */
  async unsubscribe(endpoint: string) {
    await this.repo.delete({ endpoint });
    return { ok: true };
  }

  /** Envoie un message à toutes les subscriptions */
  async sendToAll(title: string, body: string, icon = '/icon-192.png') {
    if (!this.vapidReady) {
      return { sent: 0, failed: 0, total: 0, error: 'VAPID non configuré' };
    }
    const subs = await this.repo.find();
    let sent = 0;
    let failed = 0;
    const dead: string[] = [];

    for (const s of subs) {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          JSON.stringify({
            title,
            body,
            icon,
            badge: '/icon-192.png',
            tag: 'oracle-plus',
            requireInteraction: true,
          }),
        );
        sent++;
      } catch (e: any) {
        failed++;
        // 410 Gone ou 404 = subscription expirée → nettoyer
        if (e.statusCode === 410 || e.statusCode === 404) {
          dead.push(s.id);
        }
      }
    }

    if (dead.length) {
      await this.repo.delete(dead);
      this.logger.log(`${dead.length} subscriptions expirées supprimées`);
    }

    return { sent, failed, total: subs.length, sentAt: new Date().toISOString() };
  }

  /** Envoie le message automatique selon l'heure */
  async sendScheduled() {
    const msg = getScheduledMessage();
    return this.sendToAll(msg.title, msg.body);
  }

  /** Statut */
  async getStatus() {
    const count = await this.repo.count();
    return { enabled: this.vapidReady, subsCount: count };
  }
}
