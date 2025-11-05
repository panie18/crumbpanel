import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Server } from '../entities/server.entity';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class ServersService {
  constructor(
    @InjectRepository(Server)
    private serverRepository: Repository<Server>,
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

      // Create server entry in database
      const server = await this.serverRepository.save({
        name: data.name,
        port: data.port,
        rconPort: data.rconPort,
        rconPassword: data.rconPassword,
        version: data.version,
        maxRam: data.maxRam,
        status: 'STOPPED',
      });

      console.log('✅ [SERVERS] Server created successfully:', server.id);
      return server;
    } catch (error) {
      console.error('❌ [SERVERS] Creation failed:', error);
      throw new Error(`Failed to create server: ${error.message}`);
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
    
    // Update status to STARTING
    await this.serverRepository.update(id, { status: 'STARTING' });
    
    // Simulate server startup process
    setTimeout(async () => {
      await this.serverRepository.update(id, { status: 'RUNNING' });
      console.log(`✅ [SERVERS] Server ${server.name} started successfully`);
    }, 3000);
    
    return { message: `Server ${server.name} is starting...` };
  }

  async stopServer(id: string) {
    const server = await this.findById(id);
    
    console.log(`🛑 [SERVERS] Stopping server: ${server.name}`);
    
    await this.serverRepository.update(id, { status: 'STOPPING' });
    
    setTimeout(async () => {
      await this.serverRepository.update(id, { status: 'STOPPED' });
      console.log(`✅ [SERVERS] Server ${server.name} stopped successfully`);
    }, 2000);
    
    return { message: `Server ${server.name} is stopping...` };
  }

  async restartServer(id: string) {
    const server = await this.findById(id);
    
    console.log(`🔄 [SERVERS] Restarting server: ${server.name}`);
    
    await this.stopServer(id);
    
    setTimeout(() => {
      this.startServer(id);
    }, 3000);
    
    return { message: `Server ${server.name} is restarting...` };
  }

  async deleteServer(id: string) {
    const server = await this.findById(id);
    
    console.log(`🗑️ [SERVERS] Deleting server: ${server.name}`);
    
    await this.serverRepository.delete(id);
    
    return { message: `Server ${server.name} deleted successfully` };
  }
}
