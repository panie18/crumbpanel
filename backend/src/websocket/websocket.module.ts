import { Module } from '@nestjs/common';
import { ConsoleGateway } from './console.gateway';
import { ServersModule } from '../servers/servers.module';

@Module({
  imports: [ServersModule],
  providers: [ConsoleGateway],
})
export class WebSocketModule {}
