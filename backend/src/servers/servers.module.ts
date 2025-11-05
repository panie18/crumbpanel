import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServersController } from './servers.controller';
import { ServersService } from './servers.service';
import { Server } from '../entities/server.entity';
import { MinecraftVersionService } from './minecraft-version.service';

@Module({
  imports: [TypeOrmModule.forFeature([Server])],
  controllers: [ServersController],
  providers: [ServersService, MinecraftVersionService],
  exports: [ServersService, MinecraftVersionService],
})
export class ServersModule {}
