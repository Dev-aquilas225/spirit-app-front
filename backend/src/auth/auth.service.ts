import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client } from 'google-auth-library';
import { UsersService } from '../users/users.service';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  private googleClient: OAuth2Client;

  constructor(
    private users: UsersService,
    private jwt: JwtService,
    private cfg: ConfigService,
  ) {
    this.googleClient = new OAuth2Client(cfg.get('GOOGLE_CLIENT_ID'));
  }

  async googleSignIn(idToken: string) {
    let payload: any;
    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken,
        audience: this.cfg.get('GOOGLE_CLIENT_ID'),
      });
      payload = ticket.getPayload();
    } catch {
      throw new UnauthorizedException('Invalid Google token');
    }

    let user = await this.users.findByGoogleId(payload.sub);
    if (!user) {
      user = await this.users.findByEmail(payload.email);
      if (user) {
        await this.users.update(user.id, { googleId: payload.sub });
        user = await this.users.findById(user.id);
      } else {
        user = await this.users.create({
          googleId: payload.sub,
          email: payload.email,
          firstName: payload.given_name,
          lastName: payload.family_name,
          avatar: payload.picture,
        });
      }
    }

    return this.issueTokens(user);
  }

  async sendMagicLink(email: string) {
    let user = await this.users.findByEmail(email);
    if (!user) user = await this.users.create({ email });
    const token = crypto.randomBytes(32).toString('hex');
    const expiry = new Date(Date.now() + 15 * 60 * 1000);
    await this.users.update(user.id, { magicLinkToken: token, magicLinkExpiry: expiry });
    const baseUrl = this.cfg.get('APP_BASE_URL', 'https://oracle-plus.online');
    const link = baseUrl + '/callback?token=' + token;
    console.log('Magic link for ' + email + ': ' + link);
    return { message: 'Magic link sent' };
  }

  async verifyMagicLink(token: string) {
    const user = await this.users.findByMagicToken(token);
    if (!user) throw new UnauthorizedException('Lien invalide ou expiré');

    if (!user.magicLinkExpiry || new Date() > new Date(user.magicLinkExpiry)) {
      throw new UnauthorizedException('Lien expiré. Veuillez en demander un nouveau.');
    }

    await this.users.update(user.id, { magicLinkToken: null, magicLinkExpiry: null });

    return this.issueTokens(user);
  }

  async refresh(refreshToken: string) {
    try {
      const payload = this.jwt.verify(refreshToken, {
        secret: this.cfg.get('JWT_SECRET', 'oracle-plus-secret'),
      });
      const user = await this.users.findById(payload.sub);
      if (!user) throw new UnauthorizedException();
      return this.issueTokens(user);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  issueTokens(user: any) {
    const payload = { sub: user.id, email: user.email, role: user.role };
    return {
      accessToken: this.jwt.sign(payload, { expiresIn: '7d' }),
      refreshToken: this.jwt.sign(payload, { expiresIn: '30d' }),
      user,
    };
  }
}
