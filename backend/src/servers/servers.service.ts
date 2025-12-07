import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Server } from '../entities/server.entity';
import * as fs from 'fs/promises';
import * as path from 'path';

@Injectable()
export class ServersService {
  constructor(
    @InjectRepository(Server)
    private serverRepository: Repository<Server>,
  ) {}

  // --- Helper: Basis-Pfade ---

  private getBaseDataPath(): string {
    return path.join(process.cwd(), 'data');
  }

  private getServersRoot(): string {
    return path.join(this.getBaseDataPath(), 'servers');
  }

  private getServerPath(id: string): string {
    return path.join(this.getServersRoot(), id);
  }

  // --- Basis-CRUD für Server ---

  async getAll() {
    try {
      return await this.serverRepository.find();
    } catch (error) {
      console.error('[ServersService] getAll error:', error);
      return [];
    }
  }

  async findById(id: string) {
    const server = await this.serverRepository.findOne({ where: { id } });
    if (!server) {
      throw new NotFoundException(`Server ${id} not found`);
    }
    return server;
  }

  async create(data: any) {
    console.log('[ServersService] Creating server:', data);
    
    try {
      // Erstelle Server-Entity (korrigiert: create gibt EINZELNES Objekt zurück)
      const server = this.serverRepository.create({
        name: data.name || `Server-${Date.now()}`,
        serverType: data.serverType || data.type || 'java',
        version: data.version || '1.20.4',
        maxRam: data.maxRam || data.memory || 2,
        port: data.port || 25565,
        status: 'STOPPED',
      });

      const savedServer = await this.serverRepository.save(server);
      console.log('[ServersService] Server saved to DB:', savedServer.id);

      // Erstelle Server-Verzeichnis
      const serverPath = this.getServerPath(savedServer.id);
      await fs.mkdir(serverPath, { recursive: true });

      // Update serverPath in DB
      savedServer.serverPath = serverPath;
      await this.serverRepository.save(savedServer);

      // Erstelle server.properties
      const propsPath = path.join(serverPath, 'server.properties');
      const propsContent = `motd=${savedServer.name}
max-players=20
server-port=${savedServer.port}
online-mode=true
difficulty=easy
gamemode=survival
pvp=true
`;
      await fs.writeFile(propsPath, propsContent, 'utf-8');

      // Erstelle eula.txt
      const eulaPath = path.join(serverPath, 'eula.txt');
      await fs.writeFile(eulaPath, 'eula=true\n', 'utf-8');

      console.log('[ServersService] Server created successfully:', savedServer.id);
      return savedServer;
      
    } catch (error) {
      console.error('[ServersService] create error:', error);
      throw error;
    }
  }

  async deleteServer(id: string) {
    const server = await this.findById(id);
    
    // Lösche Files
    const srvPath = this.getServerPath(id);
    try {
      await fs.rm(srvPath, { recursive: true, force: true });
    } catch (error) {
      console.warn('[ServersService] Could not delete server files:', error);
    }

    // Lösche aus DB
    await this.serverRepository.delete(id);

    return { success: true };
  }

  // --- Logs & Files ---

  async getServerLogs(id: string): Promise<string> {
    const logPath = path.join(this.getServerPath(id), 'logs', 'latest.log');
    try {
      const buf = await fs.readFile(logPath, 'utf-8');
      return buf;
    } catch {
      return '> No logs available. Server has not been started yet.';
    }
  }

  async getServerFiles(id: string, relativePath: string = '.'): Promise<any[]> {
    const base = this.getServerPath(id);
    const fullPath = path.join(base, relativePath);
    try {
      const entries = await fs.readdir(fullPath, { withFileTypes: true });
      return entries.map((e) => ({
        name: e.name,
        isDirectory: e.isDirectory(),
        path: path.join(relativePath, e.name).replace(/\\/g, '/'),
      }));
    } catch {
      return [];
    }
  }

  async downloadFile(id: string, filePath: string): Promise<Buffer> {
    const base = this.getServerPath(id);
    const fullPath = path.join(base, filePath);
    return fs.readFile(fullPath);
  }

  // --- Start/Stop/Restart & Commands ---

  async startServer(id: string) {
    const server = await this.findById(id);
    
    console.log('[ServersService] Starting server:', id);
    
    // Update status (korrigiert: TypeORM update syntax)
    await this.serverRepository.update({ id }, { status: 'STARTING' });

    // TODO: Hier echten Docker-Start oder Process-Spawn einbauen
    // Für jetzt: Simuliere Start nach 2 Sekunden
    setTimeout(async () => {
      await this.serverRepository.update({ id }, { status: 'RUNNING' });
      console.log('[ServersService] Server started:', id);
    }, 2000);

    return { success: true, status: 'starting' };
  }

  async stopServer(id: string) {
    const server = await this.findById(id);
    
    console.log('[ServersService] Stopping server:', id);
    
    // Update status
    await this.serverRepository.update({ id }, { status: 'STOPPING' });

    // TODO: Hier echten Stop einbauen
    setTimeout(async () => {
      await this.serverRepository.update({ id }, { status: 'STOPPED' });
      console.log('[ServersService] Server stopped:', id);
    }, 2000);

    return { success: true, status: 'stopping' };
  }

  async restartServer(id: string) {
    await this.stopServer(id);
    
    // Warte 3 Sekunden
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    await this.startServer(id);
    
    return { success: true, status: 'restarting' };
  }

  async sendCommand(id: string, command: string) {
    // TODO: RCON oder stdin an Process
    console.log(`[ServersService] Command to ${id}: ${command}`);
    return { success: true };
  }

  // --- Plugins ---

  async getPlugins(id: string) {
    const pluginsDir = path.join(this.getServerPath(id), 'plugins');
    try {
      await fs.mkdir(pluginsDir, { recursive: true });
      const files = await fs.readdir(pluginsDir);
      return files.filter((f) => f.endsWith('.jar')).map((f) => ({ name: f }));
    } catch {
      return [];
    }
  }

  async installPlugin(id: string, data: any) {
    console.log(`[ServersService] Installing plugin ${data.name} for server ${id}`);
    // TODO: Download von URL
    return { success: true, message: 'Plugin installation simulated' };
  }

  async deletePlugin(id: string, name: string) {
    const pluginPath = path.join(this.getServerPath(id), 'plugins', name);
    try {
      await fs.unlink(pluginPath);
      return { success: true };
    } catch (e) {
      return { success: false, error: (e as Error).message };
    }
  }

  // --- Automations ---

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
    await fs.writeFile(configPath, JSON.stringify(automations, null, 2), 'utf-8');
    return { success: true };
  }

  async deleteAutomation(id: string, autoId: string) {
    const configPath = path.join(this.getServerPath(id), 'crumbpanel_automations.json');
    let automations = await this.getAutomations(id);
    automations = automations.filter((a: any) => a.id !== autoId);
    await fs.writeFile(configPath, JSON.stringify(automations, null, 2), 'utf-8');
    return { success: true };
  }

  // --- Properties (server.properties) ---

  async getProperties(id: string) {
    const propsPath = path.join(this.getServerPath(id), 'server.properties');
    try {
      const content = await fs.readFile(propsPath, 'utf-8');
      const props: Record<string, string> = {};
      content.split('\n').forEach((line) => {
        if (line && !line.startsWith('#') && line.includes('=')) {
          const [key, ...val] = line.split('=');
          if (key) props[key.trim()] = val.join('=').trim();
        }
      });
      return props;
    } catch {
      // Return default properties wenn File nicht existiert
      return {
        'motd': 'A Minecraft Server',
        'max-players': '20',
        'gamemode': 'survival',
        'difficulty': 'easy',
        'pvp': 'true',
      };
    }
  }

  async updateProperties(id: string, props: any) {
    const propsPath = path.join(this.getServerPath(id), 'server.properties');
    let content = '# Minecraft server properties\n# Modified by CrumbPanel\n';
    try {
      for (const [key, value] of Object.entries(props)) {
        content += `${key}=${value}\n`;
      }
      await fs.writeFile(propsPath, content, 'utf-8');
      return { success: true };
    } catch (e) {
      return { success: false, error: (e as Error).message };
    }
  }
}
