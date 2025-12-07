import { Controller, Get, Post, Delete, Body, Param, UseGuards, Query, Res, Patch } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';
import { ServersService } from './servers.service';
import { MinecraftVersionService } from './minecraft-version.service';

@Controller('servers')
@UseGuards(AuthGuard('jwt'))
export class ServersController {
  constructor(
    private serversService: ServersService,
    private versionService: MinecraftVersionService,
  ) {}

  @Get()
  async getAllServers() {
    console.log('📋 [CONTROLLER] Getting all servers...');
    return this.serversService.getAll();
  }

  @Get(':id')
  async getServer(@Param('id') id: string) {
    console.log('📋 [CONTROLLER] Getting server:', id);
    return this.serversService.findById(id);
  }

  @Get(':id/logs')
  async getServerLogs(@Param('id') id: string) {
    console.log('📜 [CONTROLLER] Getting logs for server:', id);
    return this.serversService.getServerLogs(id);
  }

  @Get(':id/files')
  async getServerFiles(@Param('id') id: string) {
    return this.serversService.getServerFiles(id);
  }

  @Get(':id/files/download')
  async downloadFile(@Param('id') id: string, @Query('path') filePath: string, @Res() res: Response) {
    console.log('📥 [CONTROLLER] Downloading file:', filePath, 'from server:', id);
    
    try {
      const fileBuffer = await this.serversService.downloadFile(id, filePath);
      const fileName = filePath.split('/').pop() || 'download';
      
      res.setHeader('Content-Type', 'application/octet-stream');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.send(fileBuffer);
    } catch (error) {
      res.status(404).json({ error: 'File not found' });
    }
  }

  @Post()
  async createServer(@Body() data: any) {
    console.log('🔨 [CONTROLLER] Creating server with data:', JSON.stringify(data, null, 2));
    
    try {
      const server = await this.serversService.create(data);
      console.log('✅ [CONTROLLER] Server created successfully:', server.id);
      return server;
    } catch (error) {
      console.error('❌ [CONTROLLER] Server creation failed:', error);
      throw error;
    }
  }

  @Post(':id/start')
  async startServer(@Param('id') id: string) {
    console.log('🚀 [CONTROLLER] Starting server:', id);
    return this.serversService.startServer(id);
  }

  @Post(':id/stop')
  async stopServer(@Param('id') id: string) {
    console.log('🛑 [CONTROLLER] Stopping server:', id);
    return this.serversService.stopServer(id);
  }

  @Post(':id/restart')
  async restartServer(@Param('id') id: string) {
    console.log('🔄 [CONTROLLER] Restarting server:', id);
    return this.serversService.restartServer(id);
  }

  @Post(':id/command')
  async sendCommand(@Param('id') id: string, @Body() body: { command: string }) {
    console.log('📝 [CONTROLLER] Sending command to server:', id, body.command);
    return this.serversService.sendCommand(id, body.command);
  }

  // --- NEW: Plugins, Automations & Properties ---

  @Get(':id/plugins')
  async getPlugins(@Param('id') id: string) {
    console.log('🧩 [CONTROLLER] Getting plugins for server:', id);
    return this.serversService.getPlugins(id);
  }

  @Post(':id/plugins')
  async installPlugin(@Param('id') id: string, @Body() body: any) {
    console.log('⬇️ [CONTROLLER] Installing plugin:', id, body);
    return this.serversService.installPlugin(id, body);
  }

  @Delete(':id/plugins/:name')
  async deletePlugin(@Param('id') id: string, @Param('name') name: string) {
    console.log('🗑️ [CONTROLLER] Deleting plugin:', id, name);
    return this.serversService.deletePlugin(id, name);
  }

  @Get(':id/automations')
  async getAutomations(@Param('id') id: string) {
    console.log('🤖 [CONTROLLER] Getting automations:', id);
    return this.serversService.getAutomations(id);
  }

  @Post(':id/automations')
  async createAutomation(@Param('id') id: string, @Body() body: any) {
    console.log('🤖 [CONTROLLER] Creating automation:', id, body);
    return this.serversService.createAutomation(id, body);
  }

  @Delete(':id/automations/:autoId')
  async deleteAutomation(@Param('id') id: string, @Param('autoId') autoId: string) {
    console.log('🗑️ [CONTROLLER] Deleting automation:', id, autoId);
    return this.serversService.deleteAutomation(id, autoId);
  }

  @Patch(':id/automations/:autoId')
  async toggleAutomation(@Param('id') id: string, @Param('autoId') autoId: string, @Body() body: { enabled: boolean }) {
    console.log('🔄 [CONTROLLER] Toggling automation:', id, autoId, body.enabled);
    return this.serversService.toggleAutomation(id, autoId, body.enabled);
  }

  @Get(':id/properties')
  async getProperties(@Param('id') id: string) {
    console.log('⚙️ [CONTROLLER] Getting server properties:', id);
    return this.serversService.getProperties(id);
  }

  @Post(':id/properties')
  async updateProperties(@Param('id') id: string, @Body() body: any) {
    console.log('⚙️ [CONTROLLER] Updating server properties:', id);
    return this.serversService.updateProperties(id, body);
  }

  // ----------------------------------------------

  @Delete(':id')
  async deleteServer(@Param('id') id: string) {
    console.log('🗑️ [CONTROLLER] Deleting server:', id);
    return this.serversService.deleteServer(id);
  }

  @Get('versions/latest')
  async getLatestVersion() {
    console.log('🔍 [CONTROLLER] Getting latest Minecraft version...');
    try {
      const release = await this.versionService.getLatestReleaseVersion();
      const snapshot = await this.versionService.getLatestSnapshotVersion();
      console.log('✅ [CONTROLLER] Latest versions:', { release, snapshot });
      return { release, snapshot };
    } catch (error) {
      console.error('❌ [CONTROLLER] Failed to get latest version:', error);
      // Fallback
      return { release: '1.21.4', snapshot: '24w14a' };
    }
  }

  @Get('versions/all')
  async getAllVersions() {
    console.log('📋 [CONTROLLER] Getting all Minecraft versions...');
    try {
      const versions = await this.versionService.getReleaseVersions();
      console.log(`✅ [CONTROLLER] Found ${versions.length} versions`);
      return versions;
    } catch (error) {
      console.error('❌ [CONTROLLER] Failed to get versions:', error);
      // Fallback
      return [
        { id: '1.21.4', type: 'release' },
        { id: '1.21.3', type: 'release' },
        { id: '1.21.1', type: 'release' },
        { id: '1.20.6', type: 'release' },
        { id: '1.20.4', type: 'release' }
      ];
    }
  }

  @Get('versions/search')
  async searchVersions(@Query('q') query: string, @Query('type') type?: 'release' | 'snapshot') {
    console.log('🔍 [CONTROLLER] Searching versions:', query, type);
    return this.versionService.searchVersions(query, type);
  }
}
