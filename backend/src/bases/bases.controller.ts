import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
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

  @Post()
  async createBase(@Body() data: any) {
    return this.basesService.createBase(data);
  }

  @Delete(':id')
  async deleteBase(@Param('id') id: string) {
    await this.basesService.deleteBase(id);
    return { success: true };
  }
}
