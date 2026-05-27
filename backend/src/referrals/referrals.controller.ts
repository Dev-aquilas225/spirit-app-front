import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { ReferralsService } from './referrals.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('referrals')
@UseGuards(JwtAuthGuard)
export class ReferralsController {
  constructor(private svc: ReferralsService) {}
  @Get('me') getMyReferrals(@Req() req) { return this.svc.getMyReferrals(req.user.id); }
  @Get('share') getShareLink(@Req() req) { return this.svc.getShareLink(req.user.id); }
}
