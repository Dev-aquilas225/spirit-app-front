import { JwtService } from ;
import { ConfigService } from ;
import { UsersService } from ;
export declare class AuthService {
    private users;
    private jwt;
    private cfg;
    private googleClient;
    constructor(users: UsersService, jwt: JwtService, cfg: ConfigService);
    googleSignIn(idToken: string): Promise<any>;
    sendMagicLink(email: string): Promise<any>;
}
