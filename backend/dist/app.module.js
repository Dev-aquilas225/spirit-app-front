"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const throttler_1 = require("@nestjs/throttler");
const auth_module_1 = require("./auth/auth.module");
const users_module_1 = require("./users/users.module");
const credits_module_1 = require("./credits/credits.module");
const ai_module_1 = require("./ai/ai.module");
const prayers_module_1 = require("./prayers/prayers.module");
const subscriptions_module_1 = require("./subscriptions/subscriptions.module");
const viral_shares_module_1 = require("./viral-shares/viral-shares.module");
const notifications_module_1 = require("./notifications/notifications.module");
const library_module_1 = require("./library/library.module");
const formations_module_1 = require("./formations/formations.module");
const consultations_module_1 = require("./consultations/consultations.module");
const referrals_module_1 = require("./referrals/referrals.module");
const support_module_1 = require("./support/support.module");
const upload_module_1 = require("./upload/upload.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true }),
            throttler_1.ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
            typeorm_1.TypeOrmModule.forRootAsync({
                imports: [config_1.ConfigModule],
                useFactory: (cfg) => ({
                    type: 'mysql',
                    host: cfg.get('DB_HOST', 'mysql'),
                    port: +cfg.get('DB_PORT', 3306),
                    username: cfg.get('DB_USER', 'root'),
                    password: cfg.get('DB_PASSWORD', 'rootpassword'),
                    database: cfg.get('DB_NAME', 'oracle_plus'),
                    autoLoadEntities: true,
                    synchronize: true,
                    retryAttempts: 10,
                    retryDelay: 3000,
                }),
                inject: [config_1.ConfigService],
            }),
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            credits_module_1.CreditsModule,
            ai_module_1.AiModule,
            prayers_module_1.PrayersModule,
            subscriptions_module_1.SubscriptionsModule,
            viral_shares_module_1.ViralSharesModule,
            notifications_module_1.NotificationsModule,
            library_module_1.LibraryModule,
            formations_module_1.FormationsModule,
            consultations_module_1.ConsultationsModule,
            referrals_module_1.ReferralsModule,
            support_module_1.SupportModule,
            upload_module_1.UploadModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map