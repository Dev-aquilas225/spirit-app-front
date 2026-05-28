import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CreditsModule } from './credits/credits.module';
import { AiModule } from './ai/ai.module';
import { PrayersModule } from './prayers/prayers.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { ViralSharesModule } from './viral-shares/viral-shares.module';
import { NotificationsModule } from './notifications/notifications.module';
import { LibraryModule } from './library/library.module';
import { FormationsModule } from './formations/formations.module';
import { ConsultationsModule } from './consultations/consultations.module';
import { ReferralsModule } from './referrals/referrals.module';
import { SupportModule } from './support/support.module';
import { UploadModule } from './upload/upload.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (cfg: ConfigService) => ({
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
      inject: [ConfigService],
    }),
    AuthModule,
    UsersModule,
    CreditsModule,
    AiModule,
    PrayersModule,
    SubscriptionsModule,
    ViralSharesModule,
    NotificationsModule,
    LibraryModule,
    FormationsModule,
    ConsultationsModule,
    ReferralsModule,
    SupportModule,
    UploadModule,
  ],
})
export class AppModule {}
