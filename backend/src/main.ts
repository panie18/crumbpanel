import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import helmet from 'helmet';
import * as express from 'express';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  logger.log('🚀 Starting CrumbPanel Backend...');

  try {
    const app = await NestFactory.create(AppModule, {
      cors: true,
      logger: ['error', 'warn', 'log', 'debug'],
    });

    // CORS - Allow everything
    app.enableCors({
      origin: true,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: '*',
    });

    // Helmet with relaxed security for development
    app.use(
      helmet({
        crossOriginResourcePolicy: { policy: 'cross-origin' },
        crossOriginOpenerPolicy: false,
        crossOriginEmbedderPolicy: false,
      }),
    );

    app.use(express.json({ limit: '50mb' }));
    app.use(express.urlencoded({ extended: true, limit: '50mb' }));

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
╔═══════════════════════════════════════════════════════════╗
║   ✅ CrumbPanel Backend is READY                         ║
║   🌐 Running on http://0.0.0.0:${port}                    ║
║   📡 API: http://localhost:${port}/api                    ║
╚═══════════════════════════════════════════════════════════╝
    `);
  } catch (error) {
    logger.error('❌ Failed to start backend:', error);
    process.exit(1);
  }
}

bootstrap();
