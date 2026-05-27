import { Controller, Get, Post, Delete, Body, Param, Req, UseGuards } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('subscriptions')
@UseGuards(JwtAuthGuard)
export class SubscriptionsController {
  constructor(private svc: SubscriptionsService) {}
  @Get('plans') getPlans() { return this.svc.getPlans(); }
  @Get('me') getMe(@Req() req) { return this.svc.getMySubscription(req.user.id); }
  @Get('me/history') getHistory(@Req() req) { return this.svc.getHistory(req.user.id); }
  @Post('initiate') initiate(@Req() req, @Body() body: { plan: string; autoRenew: boolean }) { return this.svc.initiate(req.user.id, body.plan, body.autoRenew); }
  @Get('verify/:ref') verify(@Param('ref') ref: string) { return this.svc.verify(ref); }
  @Get('status/:ref') getStatus(@Param('ref') ref: string) { return this.svc.getStatus(ref); }
  @Delete('me/cancel') cancel(@Req() req) { return this.svc.cancel(req.user.id); }
  @Get('admin/all') getAll() { return this.svc.getAll(); }
  @Post('admin/activate/:id') activate(@Param('id') id: string) { return this.svc.activate(id); }
}
