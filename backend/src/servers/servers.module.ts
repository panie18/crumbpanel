import { Module } from '@nestjs/common';
import { ServersController } from './servers.controller';
import { ServersService } from './servers.service';
import { RconService } from './rcon.service';

@Module({
  controllers: [ServersController],
  providers: [ServersService, RconService],
  exports: [ServersService, RconService],
})
export class ServersModule {}
