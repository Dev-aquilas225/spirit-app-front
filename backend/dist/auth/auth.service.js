"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const google_auth_library_1 = require("google-auth-library");
const users_service_1 = require("../users/users.service");
const crypto = require("crypto");
let AuthService = class AuthService {
    constructor(users, jwt, cfg) {
        this.users = users;
        this.jwt = jwt;
        this.cfg = cfg;
        this.googleClient = new google_auth_library_1.OAuth2Client(cfg.get('GOOGLE_CLIENT_ID'));
    }
    async googleSignIn(idToken) {
        let payload;
        try {
            const ticket = await this.googleClient.verifyIdToken({
                idToken,
                audience: this.cfg.get('GOOGLE_CLIENT_ID'),
            });
            payload = ticket.getPayload();
        }
        catch {
            throw new common_1.UnauthorizedException('Invalid Google token');
        }
        let user = await this.users.findByGoogleId(payload.sub);
        if (!user) {
            user = await this.users.findByEmail(payload.email);
            if (user) {
                await this.users.update(user.id, { googleId: payload.sub });
                user = await this.users.findById(user.id);
            }
            else {
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
    async sendMagicLink(email) {
        let user = await this.users.findByEmail(email);
        if (!user)
            user = await this.users.create({ email });
        const token = crypto.randomBytes(32).toString('hex');
        const expiry = new Date(Date.now() + 15 * 60 * 1000);
        await this.users.update(user.id, { magicLinkToken: token, magicLinkExpiry: expiry });
        const baseUrl = this.cfg.get('APP_BASE_URL', 'https://oracle-plus.online');
        const link = baseUrl + '/callback?token=' + token;
        console.log('Magic link for ' + email + ': ' + link);
        return { message: 'Magic link sent' };
    }
    async verifyMagicLink(token) {
        const user = await this.users.findByMagicToken(token);
        if (!user)
            throw new common_1.UnauthorizedException('Lien invalide ou expiré');
        if (!user.magicLinkExpiry || new Date() > new Date(user.magicLinkExpiry)) {
            throw new common_1.UnauthorizedException('Lien expiré. Veuillez en demander un nouveau.');
        }
        await this.users.update(user.id, { magicLinkToken: null, magicLinkExpiry: null });
        return this.issueTokens(user);
    }
    async refresh(refreshToken) {
        try {
            const payload = this.jwt.verify(refreshToken, {
                secret: this.cfg.get('JWT_SECRET', 'oracle-plus-secret'),
            });
            const user = await this.users.findById(payload.sub);
            if (!user)
                throw new common_1.UnauthorizedException();
            return this.issueTokens(user);
        }
        catch {
            throw new common_1.UnauthorizedException('Invalid refresh token');
        }
    }
    issueTokens(user) {
        const payload = { sub: user.id, email: user.email, role: user.role };
        return {
            accessToken: this.jwt.sign(payload, { expiresIn: '7d' }),
            refreshToken: this.jwt.sign(payload, { expiresIn: '30d' }),
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                avatar: user.avatar,
                role: user.role,
                credits: user.credits,
                subscriptionStatus: user.subscriptionStatus,
                referralCode: user.referralCode,
                country: user.country,
                language: user.language,
                createdAt: user.createdAt,
            },
        };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [users_service_1.UsersService,
        jwt_1.JwtService,
        config_1.ConfigService])
], AuthService);
//# sourceMappingURL=auth.service.js.map