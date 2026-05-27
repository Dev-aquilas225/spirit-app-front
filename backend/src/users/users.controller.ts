import { Controller, Get, Patch, Delete, Body, Req, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private svc: UsersService) {}

  @Get('me')
  getMe(@Req() req) { return this.svc.findById(req.user.id); }

  @Patch('me')
  updateMe(@Req() req, @Body() body) { return this.svc.update(req.user.id, body); }

  @Delete('me')
  async deleteMe(@Req() req) {
    await this.svc.delete(req.user.id);
    return { message: 'Account deleted' };
  }
}
