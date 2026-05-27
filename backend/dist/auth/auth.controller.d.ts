import { AuthService } from './auth.service';
export declare class AuthController {
    private svc;
    constructor(svc: AuthService);
    googleSignIn(body: {
        idToken: string;
    }): Promise<{
        accessToken: string;
        refreshToken: string;
        user: any;
    }>;
    sendMagicLink(body: {
        email: string;
    }): Promise<{
        message: string;
    }>;
    verifyMagicLink(token: string): Promise<{
        accessToken: string;
        refreshToken: string;
        user: any;
    }>;
    refresh(body: {
        refreshToken: string;
    }): Promise<{
        accessToken: string;
        refreshToken: string;
        user: any;
    }>;
    logout(): {
        message: string;
    };
}
