import { Controller, Get, Post, Body, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UsersService } from '../users/users.service';

@Controller('credits')
@UseGuards(JwtAuthGuard)
export class CreditsController {
  constructor(private users: UsersService) {}

  @Get('me')
  async getCredits(@Req() req) {
    const user = await this.users.findById(req.user.id);
    return { credits: user.credits };
  }

  @Post('deduct')
  async deduct(@Req() req, @Body() body: { amount: number; action: string }) {
    const ok = await this.users.deductCredits(req.user.id, body.amount);
    if (!ok) return { success: false, message: 'Insufficient credits' };
    const user = await this.users.findById(req.user.id);
    return { success: true, credits: user.credits };
  }

  @Post('add')
  async add(@Req() req, @Body() body: { amount: number }) {
    await this.users.addCredits(req.user.id, body.amount);
    const user = await this.users.findById(req.user.id);
    return { success: true, credits: user.credits };
  }
}
