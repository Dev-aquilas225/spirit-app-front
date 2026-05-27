import { Controller, Get, Post, Body, Param, Req, UseGuards } from '@nestjs/common';
import { ViralSharesService } from './viral-shares.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('viral-shares')
@UseGuards(JwtAuthGuard)
export class ViralSharesController {
  constructor(private svc: ViralSharesService) {}
  @Post() create(@Req() req, @Body() body: any) { return this.svc.create(req.user.id, body); }
  @Get('me') getMyShares(@Req() req) { return this.svc.getMyShares(req.user.id); }
  @Get('admin/pending') getPending() { return this.svc.getPending(); }
  @Get('admin/stats') getStats() { return this.svc.getStats(); }
  @Post('admin/:id/approve') approve(@Param('id') id: string) { return this.svc.approve(id); }
  @Post('admin/:id/reject') reject(@Param('id') id: string) { return this.svc.reject(id); }
}
