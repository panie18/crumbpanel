import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { MetricsService } from './metrics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('metrics')
@UseGuards(JwtAuthGuard)
export class MetricsController {
  constructor(private metricsService: MetricsService) {}

  @Get('server/:serverId')
  getServerMetrics(@Param('serverId') serverId: string) {
    return this.metricsService.getServerMetrics(serverId);
  }

  @Get('server/:serverId/history')
  getMetricsHistory(
    @Param('serverId') serverId: string,
    @Query('limit') limit?: string,
  ) {
    return this.metricsService.getMetricsHistory(
      serverId,
      limit ? parseInt(limit) : 50,
    );
  }

  @Get('system')
  getSystemMetrics() {
    return this.metricsService.getSystemMetrics();
  }
}
