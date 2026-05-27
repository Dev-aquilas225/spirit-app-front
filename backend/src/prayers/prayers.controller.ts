import { Controller, Get, Post, Delete, Body, Param, Req, UseGuards } from '@nestjs/common';
import { PrayersService } from './prayers.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('prayers')
@UseGuards(JwtAuthGuard)
export class PrayersController {
  constructor(private svc: PrayersService) {}
  @Get('daily') getDaily() { return this.svc.getDaily(); }
  @Get('daily/:date') getDailyByDate(@Param('date') date: string) { return this.svc.getDailyByDate(date); }
  @Get() getAll(@Req() req) { return this.svc.getAll(req.user.id); }
  @Get(':id') getOne(@Req() req, @Param('id') id: string) { return this.svc.getOne(req.user.id, id); }
  @Post() create(@Req() req, @Body() body: any) { return this.svc.create(req.user.id, body); }
  @Get('programs/me') getPrograms(@Req() req) { return this.svc.getPrograms(req.user.id); }
  @Post('programs') createProgram(@Req() req, @Body() body: any) { return this.svc.createProgram(req.user.id, body); }
  @Delete('programs/:id') deleteProgram(@Req() req, @Param('id') id: string) { return this.svc.deleteProgram(req.user.id, id); }
}
