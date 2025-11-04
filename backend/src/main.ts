import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import * as express from 'express';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

async function createDefaultAdmin() {
  const prisma = new PrismaClient();
  
  try {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@mcpanel.local';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

    const existingAdmin = await prisma.user.findUnique({
      where: { email: adminEmail },
    });

    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash(adminPassword, 12);

      await prisma.user.create({
        data: {
          email: adminEmail,
          password: hashedPassword,
          role: 'ADMIN',
        },
      });

      console.log(`✓ Admin user created: ${adminEmail}`);
      console.log(`✓ Password: ${adminPassword}`);
    }
  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function bootstrap() {
  // Create default admin user
  await createDefaultAdmin();

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
╚═══════════════════════════════════════════════════════════╝
  `);
}

bootstrap();
