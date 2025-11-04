import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';

const app = express();
const prisma = new PrismaClient();

async function bootstrap() {
  console.log('🚀 Starting CrumbPanel Backend...');

  const nestApp = await NestFactory.create(AppModule, {
    cors: true,
    logger: console,
  });

  nestApp.enableCors({ origin: '*', credentials: true });
  nestApp.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  nestApp.setGlobalPrefix('api');

  const port = parseInt(process.env.PORT) || 5829;

  await nestApp.listen(port, '0.0.0.0');

  console.log(`✅ Backend running on http://0.0.0.0:${port}`);
  console.log(`📡 API available at http://localhost:${port}/api`);
}

// Basic health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

const port = process.env.PORT || 5829;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

// Handle shutdown
process.on('SIGTERM', () => {
  prisma.$disconnect();
  process.exit(0);
});

bootstrap().catch((err) => {
  console.error('❌ Failed to start backend:', err);
  process.exit(1);
});
