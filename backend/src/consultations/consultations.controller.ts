import { Controller, Get, Post, Body, Param, Req, UseGuards } from '@nestjs/common';
import { ConsultationsService } from './consultations.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('consultations')
@UseGuards(JwtAuthGuard)
export class ConsultationsController {
  constructor(private svc: ConsultationsService) {}
  @Post() create(@Req() req, @Body() body: any) { return this.svc.create(req.user.id, body); }
  @Get('me') getAll(@Req() req) { return this.svc.getAll(req.user.id); }
  @Get('me/:id') getOne(@Req() req, @Param('id') id: string) { return this.svc.getOne(req.user.id, id); }
}
