import { Controller, Get, Post, Body, Req, UseGuards, ForbiddenException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UsersService } from '../users/users.service';

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase());

function isAdmin(req: any): boolean {
  return req.user?.role === 'admin' || ADMIN_EMAILS.includes((req.user?.email ?? '').toLowerCase());
}

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

  /**
   * Ajouter des crédits à n'importe quel utilisateur.
   * Réservé aux admins — protégé par email ou rôle admin.
   * Usage : POST /credits/add { "userId": "...", "amount": 500 }
   * Si userId absent, ajoute à l'utilisateur connecté (admin uniquement).
   */
  @Post('add')
  async add(@Req() req, @Body() body: { userId?: string; amount: number }) {
    if (!isAdmin(req)) throw new ForbiddenException('Réservé aux administrateurs');
    const targetId = body.userId ?? req.user.id;
    await this.users.addCredits(targetId, body.amount);
    const user = await this.users.findById(targetId);
    return { success: true, credits: user.credits, userId: targetId };
  }
}
