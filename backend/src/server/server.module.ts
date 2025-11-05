import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServerService } from './server.service';
import { ServerController } from './server.controller';
import { ServerGateway } from './server.gateway';
import { VersionService } from '../version/version.service';
import { Server } from '../entities/server.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Server])],
  controllers: [ServerController],
  providers: [ServerService, ServerGateway, VersionService],
  exports: [ServerService],
})
export class ServerModule {}
