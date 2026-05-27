import { Controller, Post, Get, Body, Query, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private svc: AuthService) {}

  @Post('google')
  googleSignIn(@Body() body: { idToken: string }) {
    return this.svc.googleSignIn(body.idToken);
  }

  @Post('send-magic-link')
  sendMagicLink(@Body() body: { email: string }) {
    return this.svc.sendMagicLink(body.email);
  }

  @Get('verify-magic-link')
  verifyMagicLink(@Query('token') token: string) {
    return this.svc.verifyMagicLink(token);
  }

  @Post('refresh')
  refresh(@Body() body: { refreshToken: string }) {
    return this.svc.refresh(body.refreshToken);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  logout() { return { message: 'Logged out' }; }
}
