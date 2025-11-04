import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  console.log('🚀 Starting CrumbPanel Backend...');

  const app = await NestFactory.create(AppModule, {
    cors: true,
    logger: console,
  });

  app.enableCors({ origin: '*', credentials: true });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.setGlobalPrefix('api');

  const port = parseInt(process.env.PORT) || 5829;

  await app.listen(port, '0.0.0.0');

  console.log(`✅ Backend running on http://0.0.0.0:${port}`);
  console.log(`📡 API available at http://localhost:${port}/api`);
}

bootstrap().catch((err) => {
  console.error('❌ Failed to start backend:', err);
  process.exit(1);
});
