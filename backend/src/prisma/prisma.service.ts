import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    let retries = 30;
    while (retries > 0) {
      try {
        await this.$connect();
        this.logger.log('✅ Connected to database');
        return;
      } catch (error) {
        retries--;
        this.logger.warn(`⏳ Database connection failed, retrying... (${retries} left)`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    this.logger.error('❌ Could not connect to database');
    process.exit(1);
  }
}
