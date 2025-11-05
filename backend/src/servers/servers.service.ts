import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Server } from '../entities/server.entity';
import * as fs from 'fs';
import * as path from 'path';
import { MinecraftDownloaderService } from './minecraft-downloader.service';
import { ServerManagerService } from './server-manager.service';

@Injectable()
export class ServersService {
  constructor(
    @InjectRepository(Server)
    private serverRepository: Repository<Server>,
    private minecraftDownloader: MinecraftDownloaderService,
    private serverManager: ServerManagerService,
  ) {}

  async getAll() {
    console.log('📋 [SERVERS] Fetching all servers...');
    const servers = await this.serverRepository.find({
      relations: ['players', 'backups'],
    });
    console.log(`📋 [SERVERS] Found ${servers.length} servers`);
    return servers;
  }

  async create(data: any) {
    console.log('🔨 [SERVERS] Creating server with data:', data);
    
    try {
      // Create server directory
      const serverPath = path.join('/app/servers', data.name.replace(/[^a-zA-Z0-9]/g, '_'));
      if (!fs.existsSync(serverPath)) {
        fs.mkdirSync(serverPath, { recursive: true });
        console.log('📁 [SERVERS] Created server directory:', serverPath);
      }

      // Validate server type
      if (!['java', 'bedrock'].includes(data.serverType)) {
        throw new Error('Invalid server type. Must be "java" or "bedrock"');
      }

      // Create server entry in database
      const serverData: any = {
        name: data.name,
        serverType: data.serverType,
        port: data.port,
        version: data.version,
        maxRam: data.maxRam,
        status: 'INSTALLING',
      };

      // Only add RCON for Java servers
      if (data.serverType === 'java') {
        serverData.rconPort = data.rconPort;
        serverData.rconPassword = data.rconPassword;
      }

      const server = await this.serverRepository.save(serverData);

      // Download Minecraft server in background
      this.downloadMinecraftServer(server.id, data.serverType, data.version, serverPath)
        .then(() => {
          this.serverRepository.update(server.id, { status: 'STOPPED' });
          console.log(`✅ [SERVERS] Server ${server.name} installation completed`);
        })
        .catch((error) => {
          console.error(`❌ [SERVERS] Server ${server.name} installation failed:`, error);
          this.serverRepository.update(server.id, { status: 'ERROR' });
        });

      console.log(`✅ [SERVERS] ${data.serverType.toUpperCase()} server created successfully:`, server.id);
      return server;
    } catch (error) {
      console.error('❌ [SERVERS] Creation failed:', error);
      throw new Error(`Failed to create server: ${error.message}`);
    }
  }

  private async downloadMinecraftServer(serverId: string, serverType: string, version: string, serverPath: string): Promise<void> {
    console.log(`📥 [SERVERS] Starting download for server ${serverId} - ${serverType} ${version}`);
    
    try {
      if (serverType === 'java') {
        await this.minecraftDownloader.downloadJavaServer(version, serverPath);
      } else {
        await this.minecraftDownloader.downloadBedrockServer(version, serverPath);
      }
      
      console.log(`✅ [SERVERS] Download completed for server ${serverId}`);
    } catch (error) {
      console.error(`❌ [SERVERS] Download failed for server ${serverId}:`, error);
      throw error;
    }
  }

  async findById(id: string) {
    const server = await this.serverRepository.findOne({
      where: { id },
      relations: ['players', 'backups'],
    });
    
    if (!server) {
      throw new NotFoundException(`Server with ID ${id} not found`);
    }
    
    return server;
  }

  async startServer(id: string) {
    const server = await this.findById(id);
    
    console.log(`🚀 [SERVERS] Starting server: ${server.name}`);
    
    await this.serverManager.startServer(id);
    
    return { message: `Server ${server.name} is starting...` };
  }

  async stopServer(id: string) {
    const server = await this.findById(id);
    
    console.log(`🛑 [SERVERS] Stopping server: ${server.name}`);
    
    await this.serverManager.stopServer(id);
    
    return { message: `Server ${server.name} is stopping...` };
  }

  async restartServer(id: string) {
    const server = await this.findById(id);
    
    console.log(`🔄 [SERVERS] Restarting server: ${server.name}`);
    
    await this.serverManager.restartServer(id);
    
    return { message: `Server ${server.name} is restarting...` };
  }

  async deleteServer(id: string) {
    const server = await this.findById(id);
    
    console.log(`🗑️ [SERVERS] Deleting server: ${server.name}`);
    
    await this.serverRepository.delete(id);
    
    return { message: `Server ${server.name} deleted successfully` };
  }
}
