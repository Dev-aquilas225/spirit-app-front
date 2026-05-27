import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { CreditsController } from './credits.controller';

@Module({ imports: [UsersModule], controllers: [CreditsController] })
export class CreditsModule {}
