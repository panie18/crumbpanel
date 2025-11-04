import { Controller, Get, Post, Body, Param, UseGuards, Put, Delete } from '@nestjs/common';
import { ServersService } from './servers.service';
import { CreateServerDto, UpdateServerDto } from './dto/server.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('servers')
@UseGuards(JwtAuthGuard)
export class ServersController {
  constructor(private serversService: ServersService) {}

  @Get()
  async getAll() {
    return this.serversService.getAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.serversService.findOne(id);
  }

  @Post()
  async create(@Body() body: any) {
    return this.serversService.create(body);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateServerDto) {
    return this.serversService.update(id, dto);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.serversService.delete(id);
  }

  @Post(':id/start')
  start(@Param('id') id: string) {
    return this.serversService.start(id);
  }

  @Post(':id/stop')
  stop(@Param('id') id: string) {
    return this.serversService.stop(id);
  }

  @Post(':id/restart')
  restart(@Param('id') id: string) {
    return this.serversService.restart(id);
  }

  @Get(':id/status')
  getStatus(@Param('id') id: string) {
    return this.serversService.getStatus(id);
  }
}
