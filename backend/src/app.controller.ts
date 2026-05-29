import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { DataSource } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    @InjectDataSource() private readonly db: DataSource,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  /** Healthcheck — utilisé par Docker et Coolify pour détecter les crashs */
  @Get('health')
  async health() {
    const dbOk = this.db.isInitialized;
    return {
      status: dbOk ? 'ok' : 'degraded',
      db: dbOk ? 'connected' : 'disconnected',
      uptime: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
    };
  }
}
