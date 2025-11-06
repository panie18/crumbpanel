import { Controller, Get, Post, Delete, Body, Param } from '@nestjs/common';
import { BasesService } from './bases.service';

@Controller('bases')
export class BasesController {
  constructor(private basesService: BasesService) {}

  @Get('server/:serverId')
  getServerBases(@Param('serverId') serverId: string) {
    return this.basesService.getAllBases(serverId);
  }

  @Post()
  createBase(@Body() data: any) {
    return this.basesService.createBase(data);
  }

  @Delete(':id')
  deleteBase(@Param('id') id: string) {
    return this.basesService.deleteBase(id);
  }
}
