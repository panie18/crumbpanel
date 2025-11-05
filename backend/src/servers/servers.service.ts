import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChildProcess, spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import { Server } from '../entities/server.entity';
import { MinecraftVersionService } from './minecraft-version.service';

@Injectable()
export class ServersService {
  private runningServers = new Map<string, ChildProcess>();
  private serverLogs = new Map<string, string[]>();

  constructor(
    @InjectRepository(Server)
    private serverRepository: Repository<Server>,
    private versionService: MinecraftVersionService,
  ) {
    // Ensure servers directory exists
    if (!fs.existsSync('/app/minecraft-servers')) {
      fs.mkdirSync('/app/minecraft-servers', { recursive: true });
    }
  }

  async getAll() {
    console.log('📋 [SERVERS] Fetching all servers...');
    const servers = await this.serverRepository.find({
      order: { createdAt: 'DESC' },
    });
    console.log(`📋 [SERVERS] Found ${servers.length} servers`);
    return servers;
  }

  async create(data: any) {
    console.log('🔨 [SERVERS] Creating server with data:', JSON.stringify(data, null, 2));
    
    try {
      // Validate required fields
      if (!data.name?.trim()) {
        throw new Error('Server name is required');
      }

      // Use provided version or get latest - but validate it exists
      let version = data.version;
      if (!version || version === '1.21.10') {
        // 1.21.10 doesn't exist, get real latest version
        try {
          version = await this.versionService.getLatestReleaseVersion();
          console.log(`📋 [SERVERS] Using latest version from Mojang: ${version}`);
        } catch (error) {
          console.error('❌ [SERVERS] Failed to get latest version, using fallback');
          version = '1.21.4'; // Fallback to known good version
        }
      }

      // Create server directory
      const serverPath = path.join('/app/minecraft-servers', data.name.replace(/[^a-zA-Z0-9]/g, '_'));
      
      // Ensure base directory exists
      if (!fs.existsSync('/app/minecraft-servers')) {
        fs.mkdirSync('/app/minecraft-servers', { recursive: true });
      }
      
      if (!fs.existsSync(serverPath)) {
        fs.mkdirSync(serverPath, { recursive: true });
        console.log('📁 [SERVERS] Created server directory:', serverPath);
      }

      // Create server entry in database
      const serverData: any = {
        name: data.name,
        serverType: data.serverType || 'java',
        port: data.port || 25565,
        version: version,
        maxRam: data.maxRam || 2,
        maxPlayers: data.maxPlayers || 20,
        status: 'INSTALLING',
        serverPath,
      };

      // Only add RCON for Java servers
      if (data.serverType === 'java') {
        serverData.rconPort = data.rconPort || 25575;
        serverData.rconPassword = data.rconPassword || 'minecraft';
      }

      const server = await this.serverRepository.save(serverData);
      console.log(`✅ [SERVERS] Server created in database with version ${version}:`, server.id);

      // Download server JAR in background
      this.downloadMinecraftServer(server.id, server.serverType, version, serverPath)
        .then(() => {
          this.serverRepository.update(server.id, { status: 'STOPPED' });
          console.log(`✅ [SERVERS] Server ${server.name} installation completed`);
        })
        .catch((error) => {
          console.error(`❌ [SERVERS] Server ${server.name} installation failed:`, error.message);
          this.addLog(server.id, `[ERROR] Installation failed: ${error.message}`);
          this.addLog(server.id, `[ERROR] Please check if version ${version} is valid`);
          this.serverRepository.update(server.id, { status: 'ERROR' });
        });

      return server;
    } catch (error) {
      console.error('❌ [SERVERS] Creation failed:', error);
      throw error;
    }
  }

  private async downloadMinecraftServer(serverId: string, serverType: string, version: string, serverPath: string): Promise<void> {
    console.log(`📥 [SERVERS] Downloading ${serverType} server ${version}...`);
    
    try {
      if (serverType === 'bedrock') {
        // Download Bedrock server
        const downloadUrl = `https://minecraft.azureedge.net/bin-linux/bedrock-server-${version}.zip`;
        const fileName = `bedrock-server-${version}.zip`;
        const zipPath = path.join(serverPath, fileName);
        
        this.addLog(serverId, `[INFO] Downloading Bedrock server ${version}...`);
        await this.downloadFileFromUrl(downloadUrl, zipPath);
        this.addLog(serverId, `[INFO] Bedrock server downloaded successfully`);
        
      } else {
        // Download Java server using Mojang API
        this.addLog(serverId, `[INFO] Downloading Minecraft Java ${version} from Mojang...`);
        
        try {
          await this.versionService.downloadServerJar(version, serverPath);
          this.addLog(serverId, `[INFO] Server JAR downloaded successfully`);
        } catch (downloadError) {
          this.addLog(serverId, `[ERROR] Failed to download server JAR: ${downloadError.message}`);
          throw downloadError;
        }
      }

      // Create server configuration
      this.addLog(serverId, `[INFO] Creating server configuration...`);
      await this.createServerConfiguration(serverId, serverPath, serverType);
      this.addLog(serverId, `[INFO] Server configuration created`);
      
      this.addLog(serverId, `[SUCCESS] Server installation completed! You can now start the server.`);
      console.log(`✅ [SERVERS] Server ${serverId} download completed`);
      
    } catch (error) {
      console.error(`❌ [SERVERS] Download failed:`, error);
      this.addLog(serverId, `[ERROR] Download failed: ${error.message}`);
      throw error;
    }
  }

  private async createServerConfiguration(serverId: string, serverPath: string, serverType: string): Promise<void> {
    const server = await this.serverRepository.findOne({ where: { id: serverId } });
    if (!server) return;

    // Create eula.txt
    const eulaPath = path.join(serverPath, 'eula.txt');
    fs.writeFileSync(eulaPath, 'eula=true\n');

    if (serverType === 'java') {
      // Create server.properties for Java
      const configPath = path.join(serverPath, 'server.properties');
      const config = `#Minecraft server properties
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
enable-rcon=${server.rconPort ? 'true' : 'false'}
${server.rconPort ? `rcon.port=${server.rconPort}` : ''}
${server.rconPassword ? `rcon.password=${server.rconPassword}` : ''}
broadcast-rcon-to-ops=true
view-distance=10
max-build-height=320
server-ip=
allow-list=false
online-mode=true
white-list=false
enforce-whitelist=false
`.trim();
      
      fs.writeFileSync(configPath, config);
    } else {
      // Create server.properties for Bedrock
      const configPath = path.join(serverPath, 'server.properties');
      const config = `server-name=${server.name}
gamemode=survival
force-gamemode=false
difficulty=easy
allow-cheats=false
max-players=${server.maxPlayers}
online-mode=true
allow-list=false
server-port=${server.port}
server-portv6=19133
view-distance=32
tick-distance=4
player-idle-timeout=30
max-threads=8
level-name=Bedrock level
level-seed=
default-player-permission-level=member
texturepack-required=false
`.trim();
      
      fs.writeFileSync(configPath, config);
    }

    // Create plugins directory
    const pluginsDir = path.join(serverPath, 'plugins');
    if (!fs.existsSync(pluginsDir)) {
      fs.mkdirSync(pluginsDir, { recursive: true });
    }

    // Create worlds directory
    const worldsDir = path.join(serverPath, 'world');
    if (!fs.existsSync(worldsDir)) {
      fs.mkdirSync(worldsDir, { recursive: true });
    }

    console.log(`✅ [SERVERS] Server configuration created for ${serverId}`);
  }

  async startServer(id: string) {
    console.log(`🚀 [SERVERS] Starting server ${id}...`);

    const server = await this.findById(id);
    
    if (this.runningServers.has(id)) {
      throw new Error('Server is already running');
    }

    const serverPath = server.serverPath;
    if (!fs.existsSync(serverPath)) {
      throw new Error('Server files not found');
    }

    // Find server JAR
    const files = fs.readdirSync(serverPath);
    const jarFile = files.find(file => file.endsWith('.jar'));
    
    if (!jarFile && server.serverType === 'java') {
      throw new Error('Server JAR file not found');
    }

    await this.serverRepository.update(id, { status: 'STARTING' });

    let process: ChildProcess;

    if (server.serverType === 'java') {
      // Start Java server
      process = spawn('java', [
        `-Xmx${server.maxRam}G`,
        `-Xms1G`,
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
        '-jar',
        jarFile!,
        'nogui',
      ], {
        cwd: serverPath,
        stdio: ['pipe', 'pipe', 'pipe'],
      });
    } else {
      // Start Bedrock server
      const bedrockExecutable = path.join(serverPath, 'bedrock_server');
      if (fs.existsSync(bedrockExecutable)) {
        fs.chmodSync(bedrockExecutable, '755');
      }
      
      process = spawn('./bedrock_server', [], {
        cwd: serverPath,
        stdio: ['pipe', 'pipe', 'pipe'],
      });
    }

    this.runningServers.set(id, process);
    this.serverLogs.set(id, []);

    // Handle server output
    process.stdout?.on('data', (data) => {
      const output = data.toString();
      this.addLog(id, output);
      
      // Check if server is ready
      if (output.includes('Done (') || output.includes('Server started')) {
        this.serverRepository.update(id, { status: 'RUNNING' });
        console.log(`✅ [SERVERS] Server ${server.name} is now running`);
      }
    });

    process.stderr?.on('data', (data) => {
      const error = data.toString();
      this.addLog(id, `[ERROR] ${error}`);
    });

    // Handle process exit
    process.on('exit', (code) => {
      console.log(`🛑 [SERVERS] Server ${server.name} exited with code ${code}`);
      this.runningServers.delete(id);
      this.serverRepository.update(id, { status: 'STOPPED' });
    });

    process.on('error', (error) => {
      console.error(`❌ [SERVERS] Process error for ${server.name}:`, error);
      this.runningServers.delete(id);
      this.serverRepository.update(id, { status: 'ERROR' });
    });

    return { message: `Server ${server.name} is starting...` };
  }

  async stopServer(id: string) {
    console.log(`🛑 [SERVERS] Stopping server ${id}...`);

    const server = await this.findById(id);
    const process = this.runningServers.get(id);
    
    if (!process) {
      await this.serverRepository.update(id, { status: 'STOPPED' });
      return { message: `Server ${server.name} is already stopped` };
    }

    await this.serverRepository.update(id, { status: 'STOPPING' });

    // Send stop command
    process.stdin?.write('stop\n');

    // Force kill after 30 seconds
    setTimeout(() => {
      if (this.runningServers.has(id)) {
        console.log(`🔪 [SERVERS] Force killing server ${id}`);
        process.kill('SIGKILL');
      }
    }, 30000);

    return { message: `Server ${server.name} is stopping...` };
  }

  async restartServer(id: string) {
    const server = await this.findById(id);
    
    console.log(`🔄 [SERVERS] Restarting server: ${server.name}`);
    
    await this.stopServer(id);
    
    setTimeout(() => {
      this.startServer(id);
    }, 5000);
    
    return { message: `Server ${server.name} is restarting...` };
  }

  async sendCommand(id: string, command: string) {
    const process = this.runningServers.get(id);
    if (!process) {
      throw new Error('Server is not running');
    }

    console.log(`📝 [SERVERS] Command to ${id}: ${command}`);
    process.stdin?.write(`${command}\n`);
    this.addLog(id, `> ${command}`);
    
    return { success: true };
  }

  async getServerLogs(id: string): Promise<string[]> {
    return this.serverLogs.get(id) || [];
  }

  async getServerFiles(id: string, subPath: string = ''): Promise<any[]> {
    const server = await this.findById(id);
    const fullPath = path.join(server.serverPath, subPath);
    
    if (!fs.existsSync(fullPath)) {
      return [];
    }

    const files = fs.readdirSync(fullPath);
    return files.map(file => {
      const filePath = path.join(fullPath, file);
      const stats = fs.statSync(filePath);
      
      return {
        name: file,
        type: stats.isDirectory() ? 'directory' : 'file',
        size: stats.size,
        modified: stats.mtime.toISOString(),
        path: path.join(subPath, file),
      };
    });
  }

  async downloadFile(id: string, filePath: string): Promise<Buffer> {
    const server = await this.findById(id);
    const fullPath = path.join(server.serverPath, filePath);
    
    if (!fs.existsSync(fullPath)) {
      throw new Error('File not found');
    }

    return fs.readFileSync(fullPath);
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

  private async fetchJson(url: string): Promise<any> {
    return new Promise((resolve, reject) => {
      https.get(url, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (error) {
            reject(new Error(`Failed to parse JSON: ${error.message}`));
          }
        });
      }).on('error', reject);
    });
  }

  private async downloadFileFromUrl(url: string, filePath: string): Promise<void> {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    return new Promise((resolve, reject) => {
      const file = fs.createWriteStream(filePath);
      
      https.get(url, (response) => {
        if (response.statusCode !== 200) {
          reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
          return;
        }
        
        response.pipe(file);
        
        file.on('finish', () => {
          file.close();
          resolve();
        });
        
        file.on('error', (error) => {
          fs.unlink(filePath, () => {});
          reject(error);
        });
      }).on('error', reject);
    });
  }

  async findById(id: string) {
    const server = await this.serverRepository.findOne({
      where: { id },
    });
    
    if (!server) {
      throw new NotFoundException(`Server with ID ${id} not found`);
    }
    
    return server;
  }

  async deleteServer(id: string) {
    const server = await this.findById(id);
    
    console.log(`🗑️ [SERVERS] Deleting server: ${server.name}`);
    
    // Stop server if running
    if (this.runningServers.has(id)) {
      await this.stopServer(id);
    }

    // Delete server files
    if (fs.existsSync(server.serverPath)) {
      fs.rmSync(server.serverPath, { recursive: true, force: true });
    }
    
    await this.serverRepository.delete(id);
    
    // Cleanup
    this.runningServers.delete(id);
    this.serverLogs.delete(id);
    
    return { message: `Server ${server.name} deleted successfully` };
  }
}
