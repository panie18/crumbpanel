import { Controller, Get, Post, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { PlayersService } from './players.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('players')
@UseGuards(JwtAuthGuard)
export class PlayersController {
  constructor(private playersService: PlayersService) {}

  @Get('server/:serverId')
  getAllPlayers(@Param('serverId') serverId: string) {
    return this.playersService.getAllPlayers(serverId);
  }

  @Get('server/:serverId/online')
  getOnlinePlayers(@Param('serverId') serverId: string) {
    return this.playersService.getOnlinePlayers(serverId);
  }

  @Post('server/:serverId/kick')
  kickPlayer(
    @Param('serverId') serverId: string,
    @Body() body: { playerName: string; reason?: string },
  ) {
    return this.playersService.kickPlayer(serverId, body.playerName, body.reason);
  }

  @Post('server/:serverId/ban')
  banPlayer(
    @Param('serverId') serverId: string,
    @Body() body: { playerName: string; reason?: string },
  ) {
    return this.playersService.banPlayer(serverId, body.playerName, body.reason);
  }

  @Post('server/:serverId/pardon')
  pardonPlayer(
    @Param('serverId') serverId: string,
    @Body() body: { playerName: string },
  ) {
    return this.playersService.pardonPlayer(serverId, body.playerName);
  }

  @Post('server/:serverId/whitelist/add')
  whitelistAdd(
    @Param('serverId') serverId: string,
    @Body() body: { playerName: string },
  ) {
    return this.playersService.whitelistAdd(serverId, body.playerName);
  }

  @Delete('server/:serverId/whitelist/remove')
  whitelistRemove(
    @Param('serverId') serverId: string,
    @Body() body: { playerName: string },
  ) {
    return this.playersService.whitelistRemove(serverId, body.playerName);
  }
}
