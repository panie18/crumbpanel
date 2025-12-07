import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

async function bootstrap() {
  console.log('🚀 Starting CrumbPanel Backend...');

  // Ensure data directory exists
  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
    console.log('📁 Created data directory');
  }

  const app = await NestFactory.create(AppModule, {
    cors: {
      origin: ['http://localhost:8437', 'http://localhost:3000'],
      credentials: true,
    },
  });

  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
  }));

  const port = process.env.PORT || 5829;
  await app.listen(port, '0.0.0.0');

  console.log('');
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║  ✅ Backend is READY                                  ║');
  console.log(`║  🌐 http://0.0.0.0:${port}                             ║`);
  console.log(`║  📡 API: http://localhost:${port}/api                  ║`);
  console.log('║  💾 Database: SQLite ./data/crumbpanel.db              ║');
  console.log('║  🔐 JWT Auth: ENABLED                                  ║');
  console.log('╚════════════════════════════════════════════════════════╝');
  console.log('');
}

bootstrap();
