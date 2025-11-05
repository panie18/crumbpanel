import { Controller, Post, Delete, Get, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Controller('plugins')
@UseGuards(AuthGuard('jwt'))
export class PluginsController {
  @Get('search')
  async searchPlugins(@Query('q') query: string) {
    console.log('🔍 [PLUGINS] Searching for plugins:', query);
    
    // Mock plugin search results
    const mockResults = [
      {
        id: 'worldedit',
        name: 'WorldEdit',
        description: 'World editing plugin',
        version: '7.2.15',
        downloads: '50M+',
        rating: 4.9
      },
      {
        id: 'essentials',
        name: 'EssentialsX',
        description: 'Essential commands and features',
        version: '2.20.1',
        downloads: '45M+',
        rating: 4.8
      }
    ];
    
    return mockResults.filter(plugin => 
      plugin.name.toLowerCase().includes((query || '').toLowerCase())
    );
  }

  @Post(':serverId/plugins/:pluginId/install')
  async installPlugin(
    @Param('serverId') serverId: string,
    @Param('pluginId') pluginId: string
  ) {
    console.log(`📦 [PLUGINS] Installing plugin ${pluginId} on server ${serverId}`);
    
    // Simulate plugin installation
    return {
      success: true,
      message: `Plugin ${pluginId} installed successfully on server ${serverId}`
    };
  }

  @Delete(':serverId/plugins/:pluginId')
  async uninstallPlugin(
    @Param('serverId') serverId: string,
    @Param('pluginId') pluginId: string
  ) {
    console.log(`🗑️ [PLUGINS] Uninstalling plugin ${pluginId} from server ${serverId}`);
    
    return {
      success: true,
      message: `Plugin ${pluginId} uninstalled successfully from server ${serverId}`
    };
  }

  @Get(':serverId/plugins')
  async getInstalledPlugins(@Param('serverId') serverId: string) {
    console.log(`📋 [PLUGINS] Getting installed plugins for server ${serverId}`);
    
    // Mock installed plugins
    return [
      { id: 'essentials', name: 'EssentialsX', version: '2.20.1', enabled: true },
      { id: 'worldedit', name: 'WorldEdit', version: '7.2.15', enabled: true },
    ];
  }
}
