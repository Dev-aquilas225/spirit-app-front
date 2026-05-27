import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ViralSharesController } from './viral-shares.controller';
import { ViralSharesService } from './viral-shares.service';
import { ViralSharesEntity } from './viral-shares.entity';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [TypeOrmModule.forFeature([ViralSharesEntity]), UsersModule],
  controllers: [ViralSharesController],
  providers: [ViralSharesService],
  exports: [ViralSharesService],
})
export class ViralSharesModule {}
