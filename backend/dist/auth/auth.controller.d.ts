import { AuthService } from './auth.service';
export declare class AuthController {
    private svc;
    constructor(svc: AuthService);
    googleSignIn(body: {
        idToken: string;
    }): Promise<any>;
    sendMagicLink(body: {
        email: string;
    }): Promise<any>;
    verifyMagicLink(token: string): any;
    refresh(body: {
        refreshToken: string;
    }): any;
    logout(): {
        message: string;
    };
}
