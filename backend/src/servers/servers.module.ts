import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServersController } from './servers.controller';
import { ServersService } from './servers.service';
import { Server } from '../entities/server.entity';
import { MinecraftDownloaderService } from './minecraft-downloader.service';
import { ServerManagerService } from './server-manager.service';

@Module({
  imports: [TypeOrmModule.forFeature([Server])],
  controllers: [ServersController],
  providers: [ServersService, MinecraftDownloaderService, ServerManagerService],
  exports: [ServersService],
})
export class ServersModule {}
