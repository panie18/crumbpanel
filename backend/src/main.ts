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
  // Wait for database
  const dbReady = await waitForDatabase();
  if (!dbReady) {
    console.error('Cannot start without database connection');
    process.exit(1);
  }

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
║     CrumbPanel Backend Running on Port ${port}           ║
║     Visit http://localhost:8437 to get started           ║
╚═══════════════════════════════════════════════════════════╝
  `);
}

bootstrap();
