import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { NotificationsEntity } from './notifications.entity';
import { PushController } from './push.controller';
import { PushService } from './push.service';
import { PushSubscriptionEntity } from './push-subscription.entity';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([NotificationsEntity, PushSubscriptionEntity]),
    UsersModule,
  ],
  controllers: [NotificationsController, PushController],
  providers: [NotificationsService, PushService],
  exports: [NotificationsService, PushService],
})
export class NotificationsModule {}
