import { Injectable } from '@nestjs/common';
import * as https from 'https';

export interface MarketplacePlugin {
  id: string;
  name: string;
  description: string;
  author: string;
  version: string;
  downloads: number;
  rating: number;
  category: string;
  tags: string[];
  downloadUrl: string;
  icon?: string;
  sourceUrl?: string;
  dependencies?: string[];
  supportedVersions: string[];
}

@Injectable()
export class MarketplaceService {
  
  /**
   * Search SpigotMC for plugins
   */
  async searchSpigot(query: string): Promise<MarketplacePlugin[]> {
    console.log('🔍 [MARKETPLACE] Searching Spigot for:', query);
    
    // Mock data - in production, use SpigotMC API or scraping
    return [
      {
        id: 'worldedit',
        name: 'WorldEdit',
        description: 'Minecraft map editor and world editing tool',
        author: 'sk89q',
        version: '7.3.0',
        downloads: 50000000,
        rating: 4.9,
        category: 'World Management',
        tags: ['building', 'world-edit', 'admin'],
        downloadUrl: 'https://dev.bukkit.org/projects/worldedit/files/latest',
        supportedVersions: ['1.20.1', '1.21.1', '1.21.4']
      },
      {
        id: 'essentialsx',
        name: 'EssentialsX',
        description: 'Essential commands and features for Minecraft servers',
        author: 'EssentialsX Team',
        version: '2.20.1',
        downloads: 45000000,
        rating: 4.8,
        category: 'Server Management',
        tags: ['essentials', 'commands', 'economy'],
        downloadUrl: 'https://github.com/EssentialsX/Essentials/releases/latest',
        supportedVersions: ['1.19.4', '1.20.1', '1.21.1']
      },
      {
        id: 'luckperms',
        name: 'LuckPerms',
        description: 'Advanced permissions plugin with web editor',
        author: 'Luck',
        version: '5.4.113',
        downloads: 30000000,
        rating: 4.9,
        category: 'Permissions',
        tags: ['permissions', 'groups', 'admin'],
        downloadUrl: 'https://download.luckperms.net/latest',
        supportedVersions: ['1.8.8', '1.20.1', '1.21.1']
      }
    ];
  }

  /**
   * Get popular plugins
   */
  async getPopularPlugins(limit: number = 20): Promise<MarketplacePlugin[]> {
    console.log('📊 [MARKETPLACE] Getting popular plugins...');
    
    const allPlugins = await this.searchSpigot('');
    return allPlugins.slice(0, limit);
  }

  /**
   * Get plugin details
   */
  async getPluginDetails(pluginId: string): Promise<MarketplacePlugin | null> {
    console.log('🔍 [MARKETPLACE] Getting details for:', pluginId);
    
    const plugins = await this.searchSpigot('');
    return plugins.find(p => p.id === pluginId) || null;
  }

  /**
   * Download plugin from marketplace
   */
  async downloadPlugin(pluginId: string, savePath: string): Promise<string> {
    const plugin = await this.getPluginDetails(pluginId);
    if (!plugin) {
      throw new Error('Plugin not found');
    }

    console.log(`📥 [MARKETPLACE] Downloading ${plugin.name}...`);
    
    // Download plugin JAR
    return new Promise((resolve, reject) => {
      const file = require('fs').createWriteStream(savePath);
      
      https.get(plugin.downloadUrl, (response) => {
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          console.log(`✅ [MARKETPLACE] Downloaded ${plugin.name}`);
          resolve(savePath);
        });
      }).on('error', (err) => {
        require('fs').unlink(savePath, () => {});
        reject(err);
      });
    });
  }
}
