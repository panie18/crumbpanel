import { Controller, Get, Post, Delete, Body, Param } from '@nestjs/common';
import { AutomationService } from './automation.service';

@Controller('automation')
export class AutomationController {
  constructor(private automationService: AutomationService) {}

  @Get(':serverId')
  getRules(@Param('serverId') serverId: string) {
    return this.automationService.getRules(serverId);
  }

  @Post()
  createRule(@Body() data: any) {
    return this.automationService.createRule(data);
  }

  @Delete(':id')
  deleteRule(@Param('id') id: string) {
    return this.automationService.deleteRule(id);
  }
}
