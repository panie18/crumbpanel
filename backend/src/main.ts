import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  console.log('🚀 Starting CrumbPanel Backend...');

  try {
    const app = await NestFactory.create(AppModule, {
      cors: true,
      logger: ['log', 'error', 'warn', 'debug', 'verbose'],
    });

    // Enable CORS
    app.enableCors({
      origin: [
        'http://localhost:3000',
        'http://localhost:8437',
        /^http:\/\/.*:8437$/,
        /^http:\/\/.*:3000$/,
      ],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    });
    
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    app.setGlobalPrefix('api');

    const port = parseInt(process.env.PORT || '5829', 10);
    
    await app.listen(port, '0.0.0.0');
    
    console.log(`
╔════════════════════════════════════════════════════════╗
║  ✅ Backend is READY                                  ║
║  🌐 http://0.0.0.0:${port}                             ║
║  📡 API: http://localhost:${port}/api                  ║
║  💾 Database: SQLite ./data/crumbpanel.db              ║
║  🔐 JWT Auth: ENABLED                                  ║
╚════════════════════════════════════════════════════════╝
    `);
    
  } catch (error) {
    console.error('❌ Failed to start backend:', error);
    process.exit(1);
  }
}

bootstrap();
