import { AuthService } from './auth.service';
export declare class AuthController {
    private svc;
    constructor(svc: AuthService);
    googleSignIn(body: {
        idToken: string;
    }): Promise<{
        accessToken: string;
        refreshToken: string;
        user: {
            id: any;
            email: any;
            firstName: any;
            lastName: any;
            avatar: any;
            role: any;
            credits: any;
            subscriptionStatus: any;
            referralCode: any;
            country: any;
            language: any;
            createdAt: any;
        };
    }>;
    sendMagicLink(body: {
        email: string;
    }): Promise<{
        message: string;
    }>;
    verifyMagicLink(token: string): Promise<{
        accessToken: string;
        refreshToken: string;
        user: {
            id: any;
            email: any;
            firstName: any;
            lastName: any;
            avatar: any;
            role: any;
            credits: any;
            subscriptionStatus: any;
            referralCode: any;
            country: any;
            language: any;
            createdAt: any;
        };
    }>;
    refresh(body: {
        refreshToken: string;
    }): Promise<{
        accessToken: string;
        refreshToken: string;
        user: {
            id: any;
            email: any;
            firstName: any;
            lastName: any;
            avatar: any;
            role: any;
            credits: any;
            subscriptionStatus: any;
            referralCode: any;
            country: any;
            language: any;
            createdAt: any;
        };
    }>;
    logout(): {
        message: string;
    };
}
