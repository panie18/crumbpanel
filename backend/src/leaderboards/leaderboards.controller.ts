import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { LeaderboardsService } from './leaderboards.service';

@Controller('leaderboards')
@UseGuards(AuthGuard('jwt'))
export class LeaderboardsController {
  constructor(private leaderboardsService: LeaderboardsService) {}

  @Get(':serverId/:metric')
  async getLeaderboard(
    @Param('serverId') serverId: string,
    @Param('metric') metric: 'playtime' | 'kills' | 'deaths' | 'joins',
    @Query('limit') limit?: number
  ) {
    return this.leaderboardsService.getTopPlayers(serverId, metric, limit ? parseInt(limit.toString()) : 10);
  }
}
