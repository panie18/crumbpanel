import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChildProcess, spawn } from 'child_process';
import * as fs from 'fs-extra';
import * as path from 'path';
import { Server } from '../entities/server.entity';
import { VersionService } from '../version/version.service';

export interface ServerStatus {
  serverId: string;
  status: 'STOPPED' | 'STARTING' | 'RUNNING' | 'STOPPING' | 'ERROR';
  players: number;
  maxPlayers: number;
  version: string;
  uptime: number;
  memoryUsage: number;
}

@Injectable()
export class ServerService {
  private runningServers = new Map<string, ChildProcess>();
  private serverLogs = new Map<string, string[]>();
  private serverStats = new Map<string, ServerStatus>();

  constructor(
    @InjectRepository(Server)
    private serverRepository: Repository<Server>,
    private versionService: VersionService,
  ) {
    // Ensure servers directory exists
    fs.ensureDirSync('/app/minecraft-servers');
  }

  async createServer(data: {
    name: string;
    version: string;
    serverType: 'vanilla' | 'paper' | 'fabric';
    port: number;
    maxRam: number;
    maxPlayers: number;
  }) {
    console.log('🔨 [SERVER] Creating Minecraft server:', data);

    const serverPath = path.join('/app/minecraft-servers', data.name.replace(/[^a-zA-Z0-9]/g, '_'));
    await fs.ensureDir(serverPath);

    // Create server entity
    const server = await this.serverRepository.save({
      name: data.name,
      version: data.version,
      serverType: data.serverType,
      port: data.port,
      maxRam: data.maxRam,
      maxPlayers: data.maxPlayers,
      status: 'INSTALLING',
      serverPath,
    });

    // Download server JAR in background
    this.downloadAndSetupServer(server.id, data).catch(error => {
      console.error(`❌ [SERVER] Setup failed for ${server.name}:`, error);
      this.updateServerStatus(server.id, 'ERROR');
    });

    return server;
  }

  private async downloadAndSetupServer(serverId: string, data: any) {
    console.log(`📥 [SERVER] Setting up server ${serverId}...`);
    
    const server = await this.serverRepository.findOne({ where: { id: serverId } });
    if (!server) return;

    try {
      // Download server JAR
      const jarPath = await this.versionService.downloadServerJar(
        data.serverType,
        data.version,
        server.serverPath
      );

      // Create server configuration
      await this.createServerConfiguration(server, jarPath);

      // Update status to ready
      await this.updateServerStatus(serverId, 'STOPPED');
      console.log(`✅ [SERVER] Server ${server.name} setup completed`);
      
    } catch (error) {
      console.error(`❌ [SERVER] Setup failed:`, error);
      await this.updateServerStatus(serverId, 'ERROR');
    }
  }

  private async createServerConfiguration(server: Server, jarPath: string) {
    const configPath = path.join(server.serverPath, 'server.properties');
    
    const config = `
# Minecraft Server Configuration
server-port=${server.port}
max-players=${server.maxPlayers}
level-name=world
gamemode=survival
difficulty=easy
allow-nether=true
enable-command-block=false
spawn-protection=16
op-permission-level=4
pvp=true
generate-structures=true
spawn-monsters=true
spawn-animals=true
spawn-npcs=true
allow-flight=false
resource-pack=
motd=A Minecraft Server managed by CrumbPanel
enable-query=false
enable-rcon=true
rcon.port=${server.port + 1000}
rcon.password=crumbpanel
broadcast-rcon-to-ops=true
view-distance=10
max-build-height=256
server-ip=
allow-list=false
online-mode=true
white-list=false
enforce-whitelist=false
`.trim();

    await fs.writeFile(configPath, config);
    
    // Create eula.txt
    const eulaPath = path.join(server.serverPath, 'eula.txt');
    await fs.writeFile(eulaPath, 'eula=true\n');

    // Create start script
    const startScript = path.join(server.serverPath, 'start.sh');
    const startCommand = `#!/bin/bash
cd "${server.serverPath}"
java -Xmx${server.maxRam}G -Xms1G -jar "${path.basename(jarPath)}" nogui
`;
    await fs.writeFile(startScript, startCommand);
    await fs.chmod(startScript, '755');
  }

  async startServer(serverId: string): Promise<void> {
    console.log(`🚀 [SERVER] Starting server ${serverId}...`);

    const server = await this.serverRepository.findOne({ where: { id: serverId } });
    if (!server) throw new Error('Server not found');

    if (this.runningServers.has(serverId)) {
      throw new Error('Server is already running');
    }

    await this.updateServerStatus(serverId, 'STARTING');

    const jarFiles = await fs.readdir(server.serverPath);
    const jarFile = jarFiles.find(file => file.endsWith('.jar'));
    
    if (!jarFile) {
      throw new Error('Server JAR file not found');
    }

    const process = spawn('java', [
      `-Xmx${server.maxRam}G`,
      '-Xms1G',
      '-XX:+UseG1GC',
      '-XX:+ParallelRefProcEnabled',
      '-XX:MaxGCPauseMillis=200',
      '-XX:+UnlockExperimentalVMOptions',
      '-XX:+DisableExplicitGC',
      '-XX:+AlwaysPreTouch',
      '-XX:G1NewSizePercent=30',
      '-XX:G1MaxNewSizePercent=40',
      '-XX:G1HeapRegionSize=8M',
      '-XX:G1ReservePercent=20',
      '-XX:G1HeapWastePercent=5',
      '-XX:G1MixedGCCountTarget=4',
      '-XX:InitiatingHeapOccupancyPercent=15',
      '-XX:G1MixedGCLiveThresholdPercent=90',
      '-XX:G1RSetUpdatingPauseTimePercent=5',
      '-XX:SurvivorRatio=32',
      '-XX:+PerfDisableSharedMem',
      '-XX:MaxTenuringThreshold=1',
      '-jar',
      jarFile,
      'nogui'
    ], {
      cwd: server.serverPath,
      stdio: ['pipe', 'pipe', 'pipe']
    });

    this.runningServers.set(serverId, process);
    this.serverLogs.set(serverId, []);

    // Initialize server stats
    this.serverStats.set(serverId, {
      serverId,
      status: 'STARTING',
      players: 0,
      maxPlayers: server.maxPlayers,
      version: server.version,
      uptime: Date.now(),
      memoryUsage: 0
    });

    // Handle server output
    process.stdout.on('data', (data) => {
      const output = data.toString();
      this.addLog(serverId, output);
      this.parseServerOutput(serverId, output);
    });

    process.stderr.on('data', (data) => {
      const error = data.toString();
      this.addLog(serverId, `[ERROR] ${error}`);
    });

    // Handle process exit
    process.on('exit', (code) => {
      console.log(`🛑 [SERVER] Server ${server.name} exited with code ${code}`);
      this.runningServers.delete(serverId);
      this.updateServerStatus(serverId, 'STOPPED');
    });

    process.on('error', (error) => {
      console.error(`❌ [SERVER] Process error for ${server.name}:`, error);
      this.runningServers.delete(serverId);
      this.updateServerStatus(serverId, 'ERROR');
    });
  }

  async stopServer(serverId: string): Promise<void> {
    console.log(`🛑 [SERVER] Stopping server ${serverId}...`);

    const process = this.runningServers.get(serverId);
    if (!process) {
      await this.updateServerStatus(serverId, 'STOPPED');
      return;
    }

    await this.updateServerStatus(serverId, 'STOPPING');

    // Send stop command
    process.stdin.write('stop\n');

    // Force kill after 30 seconds
    setTimeout(() => {
      if (this.runningServers.has(serverId)) {
        console.log(`🔪 [SERVER] Force killing server ${serverId}`);
        process.kill('SIGKILL');
      }
    }, 30000);
  }

  async restartServer(serverId: string): Promise<void> {
    console.log(`🔄 [SERVER] Restarting server ${serverId}...`);
    await this.stopServer(serverId);
    
    // Wait for process to stop
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    await this.startServer(serverId);
  }

  async sendCommand(serverId: string, command: string): Promise<void> {
    const process = this.runningServers.get(serverId);
    if (!process) {
      throw new Error('Server is not running');
    }

    console.log(`📝 [SERVER] Command to ${serverId}: ${command}`);
    process.stdin.write(`${command}\n`);
    this.addLog(serverId, `> ${command}`);
  }

  private parseServerOutput(serverId: string, output: string) {
    const stats = this.serverStats.get(serverId);
    if (!stats) return;

    // Check if server is ready
    if (output.includes('Done (') && output.includes('For help, type "help"')) {
      stats.status = 'RUNNING';
      this.updateServerStatus(serverId, 'RUNNING');
    }

    // Parse player join/leave
    const joinMatch = output.match(/(\w+) joined the game/);
    if (joinMatch) {
      this.addLog(serverId, `🟢 ${joinMatch[1]} joined the server`);
    }

    const leaveMatch = output.match(/(\w+) left the game/);
    if (leaveMatch) {
      this.addLog(serverId, `🔴 ${leaveMatch[1]} left the server`);
    }

    // Parse player count
    const playerMatch = output.match(/There are (\d+) of a max of (\d+) players online/);
    if (playerMatch) {
      stats.players = parseInt(playerMatch[1]);
      stats.maxPlayers = parseInt(playerMatch[2]);
    }

    this.serverStats.set(serverId, stats);
  }

  private addLog(serverId: string, message: string) {
    const logs = this.serverLogs.get(serverId) || [];
    const timestamp = new Date().toISOString();
    logs.push(`[${timestamp}] ${message.trim()}`);
    
    // Keep only last 1000 log entries
    if (logs.length > 1000) {
      logs.splice(0, logs.length - 1000);
    }
    
    this.serverLogs.set(serverId, logs);
  }

  private async updateServerStatus(serverId: string, status: string) {
    await this.serverRepository.update(serverId, { status });
    
    const stats = this.serverStats.get(serverId);
    if (stats) {
      stats.status = status as any;
      this.serverStats.set(serverId, stats);
    }
  }

  // Public API methods
  async getAllServers() {
    return this.serverRepository.find({ order: { createdAt: 'DESC' } });
  }

  async getServerById(id: string) {
    return this.serverRepository.findOne({ where: { id } });
  }

  async getServerLogs(serverId: string, lines: number = 100): Promise<string[]> {
    const logs = this.serverLogs.get(serverId) || [];
    return logs.slice(-lines);
  }

  async getServerStats(serverId: string): Promise<ServerStatus | null> {
    return this.serverStats.get(serverId) || null;
  }

  async deleteServer(serverId: string): Promise<void> {
    console.log(`🗑️ [SERVER] Deleting server ${serverId}...`);
    
    // Stop server if running
    if (this.runningServers.has(serverId)) {
      await this.stopServer(serverId);
      await new Promise(resolve => setTimeout(resolve, 5000));
    }

    const server = await this.getServerById(serverId);
    if (server) {
      // Delete server files
      await fs.remove(server.serverPath).catch(console.error);
      
      // Delete from database
      await this.serverRepository.delete(serverId);
    }

    // Cleanup memory
    this.runningServers.delete(serverId);
    this.serverLogs.delete(serverId);
    this.serverStats.delete(serverId);
  }

  isServerRunning(serverId: string): boolean {
    return this.runningServers.has(serverId);
  }
}
