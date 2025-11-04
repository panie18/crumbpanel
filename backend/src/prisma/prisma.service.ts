import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    let retries = 10;
    while (retries > 0) {
      try {
        await this.$connect();
        this.logger.log('✅ Database connected successfully');
        return;
      } catch (error) {
        retries--;
        this.logger.warn(`⏳ Database connection failed, retrying... (${retries} left)`);
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }
    this.logger.error('❌ Could not connect to database after all retries');
    process.exit(1);
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
