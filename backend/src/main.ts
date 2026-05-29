import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import * as express from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bodyParser: false });

  // rawBody activé pour vérifier la signature HMAC du webhook Paystack
  app.use(express.json({
    limit: '10mb',
    verify: (req: any, _res, buf) => { req.rawBody = buf; },
  }));
  app.use(express.urlencoded({ limit: '10mb', extended: true }));

  app.enableCors({
    origin: [
      'https://oracle-plus.online',
      'https://www.oracle-plus.online',
      'http://localhost:8081',
      'http://localhost:3000',
    ],
    credentials: true,
  });
  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  const port = process.env.PORT || 4200;
  await app.listen(port, '0.0.0.0');
  console.log(`Backend running on port ${port}`);
}
bootstrap();
