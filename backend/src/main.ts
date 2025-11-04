import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import helmet from 'helmet';
import * as express from 'express';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  try {
    logger.log('🚀 Starting CrumbPanel Backend...');

    const app = await NestFactory.create(AppModule, {
      cors: true,
      logger: ['log', 'error', 'warn', 'debug'],
    });

    app.enableCors({
      origin: true,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    });

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: false,
      }),
    );

    app.setGlobalPrefix('api');

    const port = parseInt(process.env.PORT) || 5829;

    await app.listen(port, '0.0.0.0');

    logger.log(`
╔════════════════════════════════════════════════════════╗
║  ✅ Backend is READY                                  ║
║  🌐 http://0.0.0.0:${port}                             ║
║  📡 http://localhost:${port}/api                       ║
╚════════════════════════════════════════════════════════╝
    `);
  } catch (error) {
    logger.error('❌ Failed to start:', error);
    process.exit(1);
  }
}

bootstrap();
