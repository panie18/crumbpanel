import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Server } from '../entities/server.entity';
import { MinecraftVersionService } from './minecraft-version.service';
import { spawn, ChildProcessWithoutNullStreams } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

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
    const server = await this.serverRepository.findOne({ where: { id } });
    if (!server) throw new Error('Server not found');

    // Check if already running
    if (this.serverProcesses.has(id)) {
      console.log('⚠️ Server already running');
      return { message: 'Server is already running' };
    }

    await this.serverRepository.update(id, { status: 'STARTING' });
    this.addLog(id, '[INFO] Starting server...');

    try {
      const jarFile = `minecraft-server-${server.version}.jar`;
      const jarPath = path.join(server.serverPath, jarFile);

      // Check if JAR exists
      if (!fs.existsSync(jarPath)) {
        throw new Error(`Server JAR not found: ${jarFile}`);
      }

      // Start with proper Java flags
      const process = spawn('java', [
        `-Xmx${server.maxRam}G`,
        `-Xms${Math.floor(server.maxRam / 2)}G`,
        '-XX:+UseG1GC',
        '-jar', jarFile,
        'nogui'
      ], {
        cwd: server.serverPath,
        stdio: ['pipe', 'pipe', 'pipe']
      });

      this.serverProcesses.set(id, process);
      console.log('✅ Server process started, PID:', process.pid);

      // Handle stdout
      process.stdout?.on('data', (data) => {
        const output = data.toString();
        this.addLog(id, output);
        
        if (output.includes('Done (') || output.includes('For help, type "help"')) {
          this.serverRepository.update(id, { status: 'RUNNING' });
          this.addLog(id, '[SUCCESS] Server is now running!');
          console.log('✅ Server is RUNNING');
        }

        if (output.includes('Address already in use')) {
          this.addLog(id, '[ERROR] Port already in use!');
          this.serverRepository.update(id, { status: 'STOPPED' });
        }
      });

      // Handle stderr
      process.stderr?.on('data', (data) => {
        const error = data.toString();
        this.addLog(id, `[ERROR] ${error}`);
        console.error('Server error:', error);
      });

      // Handle process exit
      process.on('close', (code) => {
        console.log(`Server process exited with code ${code}`);
        this.addLog(id, `[INFO] Server stopped (exit code: ${code})`);
        this.serverRepository.update(id, { status: 'STOPPED' });
        this.serverProcesses.delete(id);
      });

      process.on('error', (error) => {
        console.error('Process error:', error);
        this.addLog(id, `[ERROR] ${error.message}`);
        this.serverRepository.update(id, { status: 'STOPPED' });
        this.serverProcesses.delete(id);
      });

    } catch (error) {
      console.error('Failed to start server:', error);
      this.addLog(id, `[ERROR] ${error.message}`);
      await this.serverRepository.update(id, { status: 'STOPPED' });
      throw error;
    }
  }

  async stopServer(id: string) {
    const process = this.serverProcesses.get(id);
    if (process) {
      process.kill();
      await this.serverRepository.update(id, { status: 'STOPPED' });
    }
  }

  async deleteServer(id: string) {
    const server = await this.serverRepository.findOne({ where: { id } });
    if (server) {
      await this.stopServer(id);
      fs.rmSync(server.serverPath, { recursive: true, force: true });
      await this.serverRepository.delete(id);
    }
  }

  private addLog(serverId: string, message: string) {
    if (!this.serverLogs.has(serverId)) {
      this.serverLogs.set(serverId, []);
    }
    const logs = this.serverLogs.get(serverId)!;
    logs.push(message);
    if (logs.length > 1000) logs.shift();
  }

  async getLogs(id: string) {
    return this.serverLogs.get(id) || [];
  }

  async sendCommand(id: string, command: string) {
    const process = this.serverProcesses.get(id);
    if (process && process.stdin) {
      process.stdin.write(command + '\n');
      return { success: true };
    }
    return { success: false, error: 'Server not running' };
  }

  async getAll() {
    return this.getAllServers();
  }

  async findById(id: string) {
    return this.getServerById(id);
  }

  async create(serverData: CreateServerDto) {
    return this.createServer(serverData);
  }

  async restartServer(id: string) {
    await this.stopServer(id);
    await new Promise(resolve => setTimeout(resolve, 2000));
    await this.startServer(id);
  }

  async getServerLogs(id: string) {
    const logs = await this.getLogs(id);
    return { logs: logs.join('') };
  }

  async getServerFiles(id: string) {
    const server = await this.getServerById(id);
    if (!server) throw new Error('Server not found');

    try {
      const files = fs.readdirSync(server.serverPath);
      return files.map(file => {
        const stats = fs.statSync(path.join(server.serverPath, file));
        return {
          name: file,
          size: stats.size,
          isDirectory: stats.isDirectory(),
          modified: stats.mtime
        };
      });
    } catch (error) {
      console.error('Error reading server files:', error);
      return [];
    }
  }

  async downloadFile(id: string, filePath: string) {
    const server = await this.getServerById(id);
    if (!server) throw new Error('Server not found');

    const fullPath = path.join(server.serverPath, filePath);
    
    if (!fs.existsSync(fullPath)) {
      throw new Error('File not found');
    }

    return fullPath;
  }
}
