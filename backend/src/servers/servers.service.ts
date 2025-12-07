import { Injectable, NotFoundException } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';

@Injectable()
export class ServersService {
  // Einfache In-Memory-Liste für Metadaten (oder ersetze durch DB/Prisma)
  private servers: any[] = [];

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

  // --- Basis-CRUD für Server (von Controller verlangt) ---

  async getAll() {
    // Falls du eine DB hast, hier gegen DB tauschen.
    return this.servers;
  }

  async findById(id: string) {
    const server = this.servers.find((s) => s.id === id);
    if (!server) {
      throw new NotFoundException(`Server ${id} not found`);
    }
    return server;
  }

  async create(data: any) {
    // Dummy-ID generieren; in echter App z.B. UUID verwenden
    const id = Date.now().toString();
    const server = {
      id,
      name: data.name ?? `Server-${id}`,
      type: data.type ?? 'java',
      memory: data.memory ?? 2048,
      ...data,
    };

    this.servers.push(server);

    // Server-Verzeichnis anlegen
    await fs.mkdir(this.getServerPath(id), { recursive: true });

    // Beispiel: minimal server.properties anlegen
    const propsPath = path.join(this.getServerPath(id), 'server.properties');
    const propsContent = `motd=${server.name}\nmax-players=20\n`;
    await fs.writeFile(propsPath, propsContent, 'utf-8');

    return server;
  }

  async deleteServer(id: string) {
    const idx = this.servers.findIndex((s) => s.id === id);
    if (idx === -1) {
      throw new NotFoundException(`Server ${id} not found`);
    }
    this.servers.splice(idx, 1);

    // Files löschen
    const srvPath = this.getServerPath(id);
    await fs.rm(srvPath, { recursive: true, force: true });

    return { success: true };
  }

  // --- Logs & Files ---

  async getServerLogs(id: string): Promise<string> {
    const logPath = path.join(this.getServerPath(id), 'logs', 'latest.log');
    try {
      const buf = await fs.readFile(logPath, 'utf-8');
      return buf;
    } catch {
      return '> No logs available.';
    }
  }

  async getServerFiles(id: string, relativePath: string = '.'): Promise<any[]> {
    const base = this.getServerPath(id);
    const fullPath = path.join(base, relativePath);
    const entries = await fs.readdir(fullPath, { withFileTypes: true });
    return entries.map((e) => ({
      name: e.name,
      isDirectory: e.isDirectory(),
      path: path.join(relativePath, e.name).replace(/\\/g, '/'),
    }));
  }

  async downloadFile(id: string, filePath: string): Promise<Buffer> {
    const base = this.getServerPath(id);
    const fullPath = path.join(base, filePath);
    return fs.readFile(fullPath);
  }

  // --- Start/Stop/Restart & Commands ---

  // Platzhalter: hier würdest du z.B. dockerode verwenden
  private async getContainer(id: string): Promise<{ start: () => Promise<void>; stop: () => Promise<void>; restart: () => Promise<void> }> {
    // Dummy-Implementierung, damit TypeScript zufrieden ist.
    // Ersetze später durch echten Docker-Code.
    return {
      start: async () => {
        console.log(`[SERVERSERVICE] start container for ${id}`);
      },
      stop: async () => {
        console.log(`[SERVERSERVICE] stop container for ${id}`);
      },
      restart: async () => {
        console.log(`[SERVERSERVICE] restart container for ${id}`);
      },
    };
  }

  async startServer(id: string) {
    const container = await this.getContainer(id);
    await container.start();
    return { success: true, status: 'starting' };
  }

  async stopServer(id: string) {
    const container = await this.getContainer(id);
    await container.stop();
    return { success: true, status: 'stopping' };
  }

  async restartServer(id: string) {
    const container = await this.getContainer(id);
    await container.restart();
    return { success: true, status: 'restarting' };
  }

  async sendCommand(id: string, command: string) {
    // Hier würdest du RCON oder Websocket an den MC-Server nutzen.
    console.log(`[SERVERSERVICE] Command to ${id}: ${command}`);
    return { success: true };
  }

  // --- Plugins (bereits von dir im Controller genutzt) ---

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
    console.log(`Installing plugin ${data.name} for server ${id}`);
    // TODO: tatsächlichen Download/Copy implementieren
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
          if
