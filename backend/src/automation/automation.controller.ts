import { Controller, Get, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AutomationService } from './automation.service';

@Controller('automation')
@UseGuards(AuthGuard('jwt'))
export class AutomationController {
  constructor(private automationService: AutomationService) {}

  @Get(':serverId')
  async getRules(@Param('serverId') serverId: string) {
    return this.automationService.getRules(serverId);
  }

  @Post()
  async createRule(@Body() data: any) {
    return this.automationService.createRule(data);
  }

  @Delete(':id')
  async deleteRule(@Param('id') id: string) {
    return this.automationService.deleteRule(id);
  }
}
