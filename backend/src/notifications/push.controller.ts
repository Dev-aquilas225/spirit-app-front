import { Controller, Post, Get, Body, UseGuards, Req } from '@nestjs/common';
import { PushService } from './push.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('push')
export class PushController {
  constructor(private svc: PushService) {}

  /** Enregistrer la subscription navigateur (appelé par le SW après permission) */
  @Post('subscribe')
  @UseGuards(JwtAuthGuard)
  subscribe(
    @Body() body: { endpoint: string; keys: { p256dh: string; auth: string } },
    @Req() req: any,
  ) {
    return this.svc.subscribe(body, req.user?.id);
  }

  /** Désabonnement */
  @Post('unsubscribe')
  unsubscribe(@Body() body: { endpoint: string }) {
    return this.svc.unsubscribe(body.endpoint);
  }

  /** Envoi manuel admin */
  @Post('send')
  @UseGuards(JwtAuthGuard)
  send(@Body() body: { title: string; body: string }) {
    return this.svc.sendToAll(body.title, body.body);
  }

  /** Déclencher le message automatique immédiatement (test admin) */
  @Post('trigger')
  @UseGuards(JwtAuthGuard)
  trigger() {
    return this.svc.sendScheduled();
  }

  /** Statut du service push */
  @Get('status')
  status() {
    return this.svc.getStatus();
  }
}
