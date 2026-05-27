import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
export declare class AuthService {
    private users;
    private jwt;
    private cfg;
    private googleClient;
    constructor(users: UsersService, jwt: JwtService, cfg: ConfigService);
    googleSignIn(idToken: string): Promise<{
        accessToken: string;
        refreshToken: string;
        user: any;
    }>;
    sendMagicLink(email: string): Promise<{
        message: string;
    }>;
    verifyMagicLink(token: string): Promise<{
        accessToken: string;
        refreshToken: string;
        user: any;
    }>;
    refresh(refreshToken: string): Promise<{
        accessToken: string;
        refreshToken: string;
        user: any;
    }>;
    issueTokens(user: any): {
        accessToken: string;
        refreshToken: string;
        user: any;
    };
}
