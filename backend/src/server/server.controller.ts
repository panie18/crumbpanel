import { Controller, Get, Post, Delete, Body, Param, UseGuards, Query } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ServerService } from './server.service';

@Controller('servers')
@UseGuards(AuthGuard('jwt'))
export class ServerController {
  constructor(private serverService: ServerService) {}

  @Get()
  async getAllServers() {
    console.log('📋 [CONTROLLER] Getting all servers...');
    return this.serverService.getAllServers();
  }

  @Get(':id')
  async getServer(@Param('id') id: string) {
    console.log('📋 [CONTROLLER] Getting server:', id);
    return this.serverService.getServerById(id);
  }

  @Get(':id/logs')
  async getServerLogs(@Param('id') id: string, @Query('lines') lines?: string) {
    console.log('📜 [CONTROLLER] Getting logs for server:', id);
    const logLines = lines ? parseInt(lines) : 100;
    return this.serverService.getServerLogs(id, logLines);
  }

  @Get(':id/stats')
  async getServerStats(@Param('id') id: string) {
    console.log('📊 [CONTROLLER] Getting stats for server:', id);
    return this.serverService.getServerStats(id);
  }

  @Post()
  async createServer(@Body() data: any) {
    console.log('🔨 [CONTROLLER] Creating server:', data);
    return this.serverService.createServer(data);
  }

  @Post(':id/start')
  async startServer(@Param('id') id: string) {
    console.log('🚀 [CONTROLLER] Starting server:', id);
    await this.serverService.startServer(id);
    return { success: true, message: 'Server starting...' };
  }

  @Post(':id/stop')
  async stopServer(@Param('id') id: string) {
    console.log('🛑 [CONTROLLER] Stopping server:', id);
    await this.serverService.stopServer(id);
    return { success: true, message: 'Server stopping...' };
  }

  @Post(':id/restart')
  async restartServer(@Param('id') id: string) {
    console.log('🔄 [CONTROLLER] Restarting server:', id);
    await this.serverService.restartServer(id);
    return { success: true, message: 'Server restarting...' };
  }

  @Post(':id/command')
  async sendCommand(@Param('id') id: string, @Body() { command }: { command: string }) {
    console.log('📝 [CONTROLLER] Sending command to server:', id, command);
    await this.serverService.sendCommand(id, command);
    return { success: true };
  }

  @Delete(':id')
  async deleteServer(@Param('id') id: string) {
    console.log('🗑️ [CONTROLLER] Deleting server:', id);
    await this.serverService.deleteServer(id);
    return { success: true, message: 'Server deleted' };
  }
}
