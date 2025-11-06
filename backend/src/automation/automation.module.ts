import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AutomationController } from './automation.controller';
import { AutomationService } from './automation.service';
import { AutomationRule } from '../entities/automation-rule.entity';
import { ServersModule } from '../servers/servers.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([AutomationRule]),
    ServersModule,
  ],
  controllers: [AutomationController],
  providers: [AutomationService],
  exports: [AutomationService],
})
export class AutomationModule {}
