import { Controller, Get, Patch, Delete, Param, Req, UseGuards } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private svc: NotificationsService) {}
  @Get() getAll(@Req() req) { return this.svc.getAll(req.user.id); }
  @Patch(':id/read') markRead(@Req() req, @Param('id') id: string) { return this.svc.markRead(req.user.id, id); }
  @Patch('read-all') markAllRead(@Req() req) { return this.svc.markAllRead(req.user.id); }
  @Delete(':id') delete(@Req() req, @Param('id') id: string) { return this.svc.delete(req.user.id, id); }
}
