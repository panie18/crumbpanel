import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import * as express from 'express';
import { PrismaClient } from '@prisma/client';

async function waitForDatabase() {
  const prisma = new PrismaClient();
  let retries = 30;

  while (retries > 0) {
    try {
      await prisma.$connect();
      console.log('✓ Database connection successful');
      await prisma.$disconnect();
      return true;
    } catch (error) {
      console.log(`Waiting for database... (${retries} retries left)`);
      retries--;
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }

  console.error('✗ Database connection failed after all retries');
  return false;
}

async function bootstrap() {
  const dbReady = await waitForDatabase();
  if (!dbReady) {
    console.error('Cannot start without database connection');
    process.exit(1);
  }

  const app = await NestFactory.create(AppModule, {
    cors: true,
    logger: ['error', 'warn', 'log'],
  });

  app.use(helmet({ crossOriginResourcePolicy: false }));
  app.enableCors({
    origin: true,
    credentials: true,
  });

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  app.setGlobalPrefix('api');

  const port = process.env.PORT || 5829;

  // WICHTIG: 0.0.0.0 statt localhost!
  await app.listen(port, '0.0.0.0');

  console.log(`
╔═══════════════════════════════════════════════════════════╗
║     ✓ CrumbPanel Backend READY on http://0.0.0.0:${port}  ║
╚═══════════════════════════════════════════════════════════╝
  `);
}

bootstrap();
