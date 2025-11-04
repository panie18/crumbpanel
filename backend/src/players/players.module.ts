import { Module } from '@nestjs/common';
import { PlayersController } from './players.controller';
import { PlayersService } from './players.service';
import { ServersModule } from '../servers/servers.module';

@Module({
  imports: [ServersModule],
  controllers: [PlayersController],
  providers: [PlayersService],
})
export class PlayersModule {}
