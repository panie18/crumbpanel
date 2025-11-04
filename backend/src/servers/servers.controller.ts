import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ServersService } from './servers.service';

@Controller('servers')
export class ServersController {
  constructor(private serversService: ServersService) {}

  @Get()
  getAll() {
    return this.serversService.getAll();
  }

  @Post()
  create(@Body() data: any) {
    return this.serversService.create(data);
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.serversService.findById(id);
  }
}
