import { Injectable, NotFoundException } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Server } from '../entities/server.entity';
import { MinecraftVersionService } from './minecraft-version.service';
import { spawn, ChildProcessWithoutNullStreams } from 'child_process';
import * as fs2 from 'fs';
import * as path2 from 'path';

interface CreateServerDto {
  name: string;
  version: string;
  port: number;
  maxPlayers: number;
  maxRam: number;
  serverType: string;
}

@Injectable()
export class ServersService {
  private serverProcesses = new Map<string, ChildProcessWithoutNullStreams>();
  private serverLogs = new Map<string, string[]>();

  constructor(
    @InjectRepository(Server)
    private serverRepository: Repository<Server>,
    private versionService: MinecraftVersionService,
  ) {}

  async getAllServers() {
    return this.serverRepository.find();
  }

  async getServerById(id: string) {
    return this.serverRepository.findOne({ where: { id } });
  }

  async createServer(serverData: CreateServerDto) {
    console.log('Creating server:', serverData);
    
    const serverPath = path.join('/app/minecraft-servers', `server-${Date.now()}`);
    fs.mkdirSync(serverPath, { recursive: true });

    // Create server.properties
    const properties = [
      `server-port=${serverData.port}`,
      `max-players=${serverData.maxPlayers}`,
      `motd=${serverData.name}`,
      'online-mode=true',
      'difficulty=normal'
    ].join('\n');
    
    fs.writeFileSync(path.join(serverPath, 'server.properties'), properties);
    fs.writeFileSync(path.join(serverPath, 'eula.txt'), 'eula=true');

    // Download server JAR
    await this.versionService.downloadServerJar(serverData.version, serverPath);

    const server = this.serverRepository.create({
      name: serverData.name,
      version: serverData.version,
      port: serverData.port,
      maxPlayers: serverData.maxPlayers,
      maxRam: serverData.maxRam,
      serverType: serverData.serverType,
      serverPath: serverPath,
      status: 'STOPPED',
    });

    return this.serverRepository.save(server);
  }

  async startServer(id: string) {
    const container = await this.getContainer(id);
    // Fix: Remove arguments from start() to match Dockerode types
    await container.start();
    return { success: true, status: 'starting' };
  }

  async stopServer(id: string) {
    const container = await this.getContainer(id);
    // Fix: Remove arguments from stop()
    await container.stop();
    return { success: true, status: 'stopping' };
  }

  async restartServer(id: string) {
    const container = await this.getContainer(id);
    // Fix: Remove arguments from restart()
    await container.restart();
    return { success: true, status: 'restarting' };
  }

  // --- Plugins Implementation ---
  async getPlugins(id: string) {
    const serverPath = this.getServerPath(id);
    const pluginsDir = path.join(serverPath, 'plugins');
    try {
      await fs.mkdir(pluginsDir, { recursive: true });
      const files = await fs.readdir(pluginsDir);
      return files.filter(f => f.endsWith('.jar')).map(f => ({ name: f }));
    } catch (e) {
      return [];
    }
  }

  async installPlugin(id: string, data: any) {
    // In a real implementation, this would download from a URL
    console.log(`Installing plugin ${data.name} for server ${id}`);
    return { success: true, message: 'Plugin installation simulated' };
  }

  async deletePlugin(id: string, name: string) {
    const serverPath = this.getServerPath(id);
    const pluginPath = path.join(serverPath, 'plugins', name);
    try {
      await fs.unlink(pluginPath);
      return { success: true };
    } catch (e) {
      return { success: false, error: (e as Error).message };
    }
  }

  // --- Automations Implementation ---
  async getAutomations(id: string) {
    const configPath = path.join(this.getServerPath(id), 'crumbpanel_automations.json');
    try {
      const data = await fs.readFile(configPath, 'utf-8');
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  async createAutomation(id: string, automation: any) {
    const configPath = path.join(this.getServerPath(id), 'crumbpanel_automations.json');
    const automations = await this.getAutomations(id);
    automations.push({ ...automation, id: Date.now().toString() });
    await fs.writeFile(configPath, JSON.stringify(automations, null, 2));
    return { success: true };
  }

  async deleteAutomation(id: string, autoId: string) {
    const configPath = path.join(this.getServerPath(id), 'crumbpanel_automations.json');
    let automations = await this.getAutomations(id);
    automations = automations.filter((a: any) => a.id !== autoId);
    await fs.writeFile(configPath, JSON.stringify(automations, null, 2));
    return { success: true };
  }

  // --- Properties (Settings & Colors) ---
  async getProperties(id: string) {
    const propsPath = path.join(this.getServerPath(id), 'server.properties');
    try {
      const content = await fs.readFile(propsPath, 'utf-8');
      const props: Record<string, string> = {};
      content.split('\n').forEach(line => {
        if (line && !line.startsWith('#') && line.includes('=')) {
          const [key, ...val] = line.split('=');
          if
