import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import * as express from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    cors: true,
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  // Security
  app.use(helmet());
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Global validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // API prefix
  app.setGlobalPrefix('api');

  const port = process.env.PORT || 5829;
  await app.listen(port);
  
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║     Minecraft Panel Backend Running on Port ${port}      ║
╚═══════════════════════════════════════════════════════════╝
  `);
}

bootstrap();
