import { Controller, Get, Post, Delete, Body, Param, Req, UseGuards, Headers, RawBodyRequest } from '@nestjs/common';
import { Request } from 'express';
import { SubscriptionsService } from './subscriptions.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private svc: SubscriptionsService) {}

  /** Route publique — plans disponibles */
  @Get('plans') getPlans() { return this.svc.getPlans(); }

  /** Webhook Paystack — doit rester public (pas de JWT) */
  @Post('webhook')
  webhook(
    @Headers('x-paystack-signature') signature: string,
    @Body() body: any,
    @Req() req: RawBodyRequest<Request>,
  ) {
    return this.svc.handleWebhook(signature, body, req.rawBody);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me') getMe(@Req() req) { return this.svc.getMySubscription(req.user.id); }

  @UseGuards(JwtAuthGuard)
  @Get('me/history') getHistory(@Req() req) { return this.svc.getHistory(req.user.id); }

  @UseGuards(JwtAuthGuard)
  @Post('initiate') initiate(@Req() req, @Body() body: { plan: string; autoRenew: boolean }) { return this.svc.initiate(req.user.id, body.plan, body.autoRenew); }

  @UseGuards(JwtAuthGuard)
  @Get('verify/:ref') verify(@Param('ref') ref: string) { return this.svc.verify(ref); }

  @UseGuards(JwtAuthGuard)
  @Get('status/:ref') getStatus(@Param('ref') ref: string) { return this.svc.getStatus(ref); }

  @UseGuards(JwtAuthGuard)
  @Delete('me/cancel') cancel(@Req() req) { return this.svc.cancel(req.user.id); }

  @UseGuards(JwtAuthGuard)
  @Get('admin/all') getAll() { return this.svc.getAll(); }

  @UseGuards(JwtAuthGuard)
  @Post('admin/activate/:id') activate(@Param('id') id: string) { return this.svc.activate(id); }
}
