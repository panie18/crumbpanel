import { Controller, Get, Param } from '@nestjs/common';
import { LeaderboardsService } from './leaderboards.service';

@Controller('leaderboards')
export class LeaderboardsController {
  constructor(private leaderboardsService: LeaderboardsService) {}

  @Get(':serverId/:metric')
  getLeaderboard(@Param('serverId') serverId: string, @Param('metric') metric: string) {
    return this.leaderboardsService.getTopPlayers(serverId, metric as any, 10);
  }
}
