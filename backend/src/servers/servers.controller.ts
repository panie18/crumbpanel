import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ServersService } from './servers.service';

@Controller('servers')
@UseGuards(AuthGuard('jwt'))
export class ServersController {
  constructor(private serversService: ServersService) {}

  @Get()
  async getAll() {
    console.log('🎮 [SERVERS] Getting all servers...');
    return this.serversService.getAll();
  }

  @Post()
  async create(@Body() data: any, @Req() req: any) {
    console.log('🎮 [SERVERS] Creating server for user:', req.user?.email);
    console.log('🎮 [SERVERS] Server data:', data);
    
    try {
      // Validate required fields
      if (!data.name?.trim()) {
        throw new Error('Server name is required');
      }
      
      if (!data.version) {
        throw new Error('Minecraft version is required');
      }
      
      if (!data.rconPassword?.trim()) {
        throw new Error('RCON password is required');
      }
      
      const result = await this.serversService.create(data);
      console.log('✅ [SERVERS] Server created successfully:', result.id);
      
      return result;
    } catch (error) {
      console.error('❌ [SERVERS] Creation failed:', error);
      throw error;
    }
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    console.log('🎮 [SERVERS] Getting server:', id);
    return this.serversService.findById(id);
  }

  @Post(':id/start')
  async start(@Param('id') id: string) {
    console.log('🎮 [SERVERS] Starting server:', id);
    return this.serversService.startServer(id);
  }

  @Post(':id/stop')
  async stop(@Param('id') id: string) {
    console.log('🎮 [SERVERS] Stopping server:', id);
    return this.serversService.stopServer(id);
  }

  @Post(':id/restart')
  async restart(@Param('id') id: string) {
    console.log('🎮 [SERVERS] Restarting server:', id);
    return this.serversService.restartServer(id);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    console.log('🎮 [SERVERS] Deleting server:', id);
    return this.serversService.deleteServer(id);
  }
}
