import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DataSource } from 'typeorm';

async function testDatabase() {
  console.log('🔍 Testing database connection...');
  try {
    const dataSource = new DataSource({
      type: 'sqlite',
      database: './data/crumbpanel.db',
      synchronize: true,
      logging: true,
    });
    
    await dataSource.initialize();
    console.log('✅ Database connection successful');
    await dataSource.destroy();
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
}

async function bootstrap() {
  console.log('🚀 Starting CrumbPanel Backend...');
  
  // Test database first
  const dbWorking = await testDatabase();
  if (!dbWorking) {
    console.error('❌ Cannot start without database');
    process.exit(1);
  }

  try {
    const app = await NestFactory.create(AppModule, {
      cors: {
        origin: ['http://localhost:8437', 'http://localhost:3000'], 
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
      },
      logger: ['log', 'error', 'warn', 'debug', 'verbose'],
    });

    app.enableCors({
      origin: ['http://localhost:8437', 'http://localhost:3000'], 
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
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
    
    // Test routes after startup
    setTimeout(() => testRoutes(port), 2000);
    
  } catch (error) {
    console.error('❌ Failed to start backend:', error);
    process.exit(1);
  }
}

async function testRoutes(port: number) {
  console.log('🧪 Testing routes...');
  try {
    const axios = require('axios');
    const response = await axios.get(`http://localhost:${port}/api/auth/setup-status`);
    console.log('✅ Setup status route working:', response.data);
  } catch (error) {
    console.error('❌ Route test failed:', error.message);
  }
}

bootstrap().catch(err => {
  console.error('❌ Failed to start backend:', err);
  process.exit(1);
});
