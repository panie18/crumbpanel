import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { BasesService } from './bases.service';

@Controller('bases')
@UseGuards(AuthGuard('jwt'))
export class BasesController {
  constructor(private basesService: BasesService) {}

  @Get('server/:serverId')
  async getServerBases(@Param('serverId') serverId: string) {
    return this.basesService.getAllBases(serverId);
  }

  @Get('player/:playerId')
  async getPlayerBases(@Param('playerId') playerId: string) {
    return this.basesService.getPlayerBases(playerId);
  }

  @Get('nearby')
  async getBasesNearby(
    @Query('serverId') serverId: string,
    @Query('x') x: number,
    @Query('z') z: number,
    @Query('radius') radius: number = 1000
  ) {
    return this.basesService.getBasesNearby(serverId, x, z, radius);
  }

  @Post()
  async createBase(@Body() data: any) {
    return this.basesService.createBase(data);
  }

  @Put(':id')
  async updateBase(@Param('id') id: string, @Body() updates: any) {
    return this.basesService.updateBase(id, updates);
  }

  @Delete(':id')
  async deleteBase(@Param('id') id: string) {
    await this.basesService.deleteBase(id);
    return { success: true };
  }
}
