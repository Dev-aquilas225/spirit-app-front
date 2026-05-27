import { Controller, Get, Post, Body, Req, UseGuards } from '@nestjs/common';
import { SupportService } from './support.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('support')
@UseGuards(JwtAuthGuard)
export class SupportController {
  constructor(private svc: SupportService) {}
  @Post('tickets') create(@Req() req, @Body() body: any) { return this.svc.create(req.user.id, body); }
  @Get('tickets/me') getMyTickets(@Req() req) { return this.svc.getMyTickets(req.user.id); }
}
