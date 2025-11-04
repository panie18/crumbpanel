import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    cors: true,
  });
  
  const port = process.env.PORT || 5829;
  await app.listen(port);
  console.log(`✅ CrumbPanel Backend running on port ${port}`);
}

bootstrap();
