import { Controller, Get, Post, Patch, Delete, Body, Param, Req, UseGuards } from '@nestjs/common';
import { FormationsService } from './formations.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('formations')
@UseGuards(JwtAuthGuard)
export class FormationsController {
  constructor(private svc: FormationsService) {}
  @Get() getAll() { return this.svc.getAll(); }
  @Get('admin/all') getAllAdmin() { return this.svc.getAllAdmin(); }
  @Get('progress/me') getProgress(@Req() req) { return this.svc.getProgress(req.user.id); }
  @Get(':id') getOne(@Param('id') id: string) { return this.svc.getOne(id); }
  @Get(':id/lessons/:lid') getLesson(@Param('id') id: string, @Param('lid') lid: string) { return this.svc.getLesson(id, lid); }
  @Post(':id/progress') addProgress(@Req() req, @Param('id') id: string, @Body() body: any) { return this.svc.addProgress(req.user.id, id, body.lessonId); }
  @Post() create(@Body() body: any) { return this.svc.create(body); }
  @Post(':id/lessons') addLesson(@Param('id') id: string, @Body() body: any) { return this.svc.addLesson(id, body); }
  @Patch(':id') update(@Param('id') id: string, @Body() body: any) { return this.svc.update(id, body); }
  @Delete(':id') delete(@Param('id') id: string) { return this.svc.delete(id); }
}
