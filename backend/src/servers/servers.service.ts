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
    const server = await this.serverRepository.findOne({ where: { id } });
    if (!server) {
      throw new Error('Server not found');
    }

    console.log('🚀 [SERVERS] Starting server:', server.name);

    // Update status to starting
    await this.serverRepository.update(id, { status: 'STARTING' });
    this.addLog(id, '[INFO] Server is starting...');

    try {
      const serverPath = server.serverPath;
      const jarFile = `minecraft-server-${server.version}.jar`;

      // Check if JAR exists
      if (!fs.existsSync(path.join(serverPath, jarFile))) {
        throw new Error(`Server JAR not found: ${jarFile}`);
      }

      // Kill existing process if any
      if (this.serverProcesses.has(id)) {
        console.log('⚠️ [SERVERS] Killing existing process for:', server.name);
        const oldProcess = this.serverProcesses.get(id);
        oldProcess?.kill();
        this.serverProcesses.delete(id);
      }

      // Start server process with correct flags
      const process = spawn('java', [
        `-Xmx${server.maxRam}G`,
        `-Xms${Math.floor(server.maxRam / 2)}G`,
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
        '-Dusing.aikars.flags=https://mcflags.emc.gs',
        '-Daikars.new.flags=true',
        '-jar', jarFile,
        'nogui'
      ], {
        cwd: serverPath,
        stdio: ['pipe', 'pipe', 'pipe']
      });

      this.serverProcesses.set(id, process);
      console.log('✅ [SERVERS] Process started with PID:', process.pid);

      // Handle process output
      process.stdout?.on('data', (data) => {
        const output = data.toString();
        this.addLog(id, output);
        console.log(`[${server.name}] ${output.trim()}`);

        // Check if server is ready
        if (output.includes('Done (') || output.includes('For help, type "help"')) {
          this.serverRepository.update(id, { status: 'RUNNING' });
          console.log(`✅ [SERVERS] Server ${server.name} is now RUNNING`);
          this.addLog(id, '[SUCCESS] Server started successfully! Players can now join.');
          this.addLog(id, `[INFO] Server address: ${server.port}`);
        }

        // Check for port binding issues
        if (output.includes('Address already in use') || output.includes('Cannot bind')) {
          console.error(`❌ [SERVERS] Port ${server.port} is already in use!`);
          this.addLog(id, `[ERROR] Port ${server.port} is already in use! Change the port and try again.`);
          this.serverRepository.update(id, { status: 'STOPPED' });
        }
      });

      process.stderr?.on('data', (data) => {
        const error = data.toString();
        this.addLog(id, `[ERROR] ${error}`);
        console.error(`[${server.name}] ERROR: ${error.trim()}`);
      });

    // Handle process exit(code) => {
    process.on('exit', (code) => {e}] Process exited with code ${code}`);
      console.log(`🛑 [SERVERS] Server ${server.name} exited with code ${code}`);
      this.runningServers.delete(id);id, { status: 'STOPPED' });
      this.serverRepository.update(id, { status: 'STOPPED' });
    }););

    process.on('error', (error) => { {
      console.error(`❌ [SERVERS] Process error for ${server.name}:`, error);
      this.runningServers.delete(id);ror.message}`);
      this.serverRepository.update(id, { status: 'ERROR' }); });
    }););

    return { message: `Server ${server.name} is starting...` };
  }   setTimeout(async () => {
        const currentServer = await this.serverRepository.findOne({ where: { id } });
  async stopServer(id: string) {s === 'STARTING') {
    console.log(`🛑 [SERVERS] Stopping server ${id}...`);taking too long to start`);
          this.addLog(id, '[WARNING] Server is taking longer than expected to start...');
    const server = await this.findById(id);
    const process = this.runningServers.get(id);
    
    if (!process) { {
      await this.serverRepository.update(id, { status: 'STOPPED' });
      return { message: `Server ${server.name} is already stopped` };
    } await this.serverRepository.update(id, { status: 'STOPPED' });
      throw error;
    await this.serverRepository.update(id, { status: 'STOPPING' });
  }
    // Send stop command
    process.stdin?.write('stop\n');
    console.log(`🛑 [SERVERS] Stopping server ${id}...`);
    // Force kill after 30 seconds
    setTimeout(() => {it this.findById(id);
      if (this.runningServers.has(id)) {get(id);
        console.log(`🔪 [SERVERS] Force killing server ${id}`);
        process.kill('SIGKILL');
      }wait this.serverRepository.update(id, { status: 'STOPPED' });
    }, 30000); message: `Server ${server.name} is already stopped` };
    }
    return { message: `Server ${server.name} is stopping...` };
  } await this.serverRepository.update(id, { status: 'STOPPING' });

  async restartServer(id: string) {
    const server = await this.findById(id);
    
    console.log(`🔄 [SERVERS] Restarting server: ${server.name}`);
    setTimeout(() => {
    await this.stopServer(id);has(id)) {
        console.log(`🔪 [SERVERS] Force killing server ${id}`);
    setTimeout(() => {SIGKILL');
      this.startServer(id);
    }, 5000);;
    
    return { message: `Server ${server.name} is restarting...` };
  }

  async sendCommand(id: string, command: string) {
    const process = this.runningServers.get(id);
    if (!process) {
      throw new Error('Server is not running');: ${server.name}`);
    }
    await this.stopServer(id);
    console.log(`📝 [SERVERS] Command to ${id}: ${command}`);
    process.stdin?.write(`${command}\n`);
    this.addLog(id, `> ${command}`);
    }, 5000);
    return { success: true };
  } return { message: `Server ${server.name} is restarting...` };
  }
  async getServerLogs(id: string): Promise<string[]> {
    return this.serverLogs.get(id) || [];string) {
  } const process = this.runningServers.get(id);
    if (!process) {
  async getServerFiles(id: string, subPath: string = ''): Promise<any[]> {
    const server = await this.findById(id);
    const fullPath = path.join(server.serverPath, subPath);
    console.log(`📝 [SERVERS] Command to ${id}: ${command}`);
    if (!fs.existsSync(fullPath)) {}\n`);
      return [];id, `> ${command}`);
    }
    return { success: true };
    const files = fs.readdirSync(fullPath);
    return files.map(file => {
      const filePath = path.join(fullPath, file);[]> {
      const stats = fs.statSync(filePath);
      
      return {
        name: file,les(id: string, subPath: string = ''): Promise<any[]> {
        type: stats.isDirectory() ? 'directory' : 'file',
        size: stats.size,.join(server.serverPath, subPath);
        modified: stats.mtime.toISOString(),
        path: path.join(subPath, file),
      };turn [];
    });
  }
    const files = fs.readdirSync(fullPath);
  async downloadFile(id: string, filePath: string): Promise<Buffer> {
    const server = await this.findById(id);file);
    const fullPath = path.join(server.serverPath, filePath);
      
    if (!fs.existsSync(fullPath)) {
      throw new Error('File not found');
    }   type: stats.isDirectory() ? 'directory' : 'file',
        size: stats.size,
    return fs.readFileSync(fullPath);ring(),
  }     path: path.join(subPath, file),
      };
  private addLog(serverId: string, message: string) {
    const logs = this.serverLogs.get(serverId) || [];
    const timestamp = new Date().toISOString();
    logs.push(`[${timestamp}] ${message.trim()}`);: Promise<Buffer> {
    const server = await this.findById(id);
    // Keep only last 1000 log entriesserverPath, filePath);
    if (logs.length > 1000) {
      logs.splice(0, logs.length - 1000);
    } throw new Error('File not found');
    }
    this.serverLogs.set(serverId, logs);
  } return fs.readFileSync(fullPath);
  }
  private async fetchJson(url: string): Promise<any> {
    return new Promise((resolve, reject) => {tring) {
      https.get(url, (res) => {s.get(serverId) || [];
        let data = '';new Date().toISOString();
        res.on('data', chunk => data += chunk);`);
        res.on('end', () => {
          try {y last 1000 log entries
            resolve(JSON.parse(data));
          } catch (error) {ength - 1000);
            reject(new Error(`Failed to parse JSON: ${error.message}`));
          }
        });rverLogs.set(serverId, logs);
      }).on('error', reject);
    });
  }rivate async fetchJson(url: string): Promise<any> {
    return new Promise((resolve, reject) => {
  private async downloadFileFromUrl(url: string, filePath: string): Promise<void> {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {> data += chunk);
      fs.mkdirSync(dir, { recursive: true });
    }     try {
            resolve(JSON.parse(data));
    return new Promise((resolve, reject) => {
      const file = fs.createWriteStream(filePath);: ${error.message}`));
          }
      https.get(url, (response) => {
        if (response.statusCode !== 200) {
          reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
          return;
        }
        e async downloadFileFromUrl(url: string, filePath: string): Promise<void> {
        response.pipe(file);(filePath);
        !fs.existsSync(dir)) {
        file.on('finish', () => {ve: true });
          file.close();
          resolve();
        });new Promise((resolve, reject) => {
        nst file = fs.createWriteStream(filePath);
        file.on('error', (error) => {
          fs.unlink(filePath, () => {});
          reject(error);tusCode !== 200) {
        });eject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
      }).on('error', reject);
    }); }
  }     
        response.pipe(file);
  async findById(id: string) {
    const server = await this.serverRepository.findOne({
      where: { id },();
    });   resolve();
        });
    if (!server) {
      throw new NotFoundException(`Server with ID ${id} not found`);
    }     fs.unlink(filePath, () => {});
          reject(error);
    return server;
  }   }).on('error', reject);
    });
  async deleteServer(id: string) {
    const server = await this.findById(id);
    ync findById(id: string) {
    console.log(`🗑️ [SERVERS] Deleting server: ${server.name}`);
      where: { id },
    // Stop server if running
    if (this.runningServers.has(id)) {
      await this.stopServer(id);
    } throw new NotFoundException(`Server with ID ${id} not found`);
    }
    // Delete server files
    if (fs.existsSync(server.serverPath)) {
      fs.rmSync(server.serverPath, { recursive: true, force: true });
    }
    ync deleteServer(id: string) {
    await this.serverRepository.delete(id);
    
    // Cleanupg(`🗑️ [SERVERS] Deleting server: ${server.name}`);
    this.runningServers.delete(id);
    this.serverLogs.delete(id);
    if (this.runningServers.has(id)) {
    return { message: `Server ${server.name} deleted successfully` };
  } }

  async createServer(serverData: CreateServerDto) {    // Delete server files






















































}  }    }      throw error;      console.error('❌ [SERVERS] Failed to create server:', error);    } catch (error) {      return savedServer;      console.log('✅ [SERVERS] Server created:', savedServer.id);      const savedServer = await this.serverRepository.save(server);      });        status: 'STOPPED',        serverPath: serverPath,        serverType: serverData.serverType,        maxRam: serverData.maxRam,        maxPlayers: serverData.maxPlayers,        port: serverData.port,        version: serverData.version,        name: serverData.name,      const server = this.serverRepository.create({      // Create server entity      await this.versionService.downloadServerJar(serverData.version, serverPath);      console.log(`📥 [SERVERS] Downloading Minecraft ${serverData.version}...`);      // Download server JAR      console.log('✅ [SERVERS] EULA accepted');      fs.writeFileSync(path.join(serverPath, 'eula.txt'), 'eula=true');      // Accept EULA            fs.writeFileSync(path.join(serverPath, 'server.properties'), serverProperties);`.trim();rcon.port=${serverData.port + 50}rcon.password=crumbpanel${Date.now()}enable-rcon=trueonline-mode=truepvp=truegamemode=survivaldifficulty=normalmotd=${serverData.name}max-players=${serverData.maxPlayers}server-port=${serverData.port}      const serverProperties = `      // Create server.properties with correct port      fs.mkdirSync(serverPath, { recursive: true });      const serverPath = path.join('/app/minecraft-servers', `server-${Date.now()}`);      // Generate unique server path    try {    console.log('🎮 [SERVERS] Creating new server:', serverData);    if (fs.existsSync(server.serverPath)) {
      fs.rmSync(server.serverPath, { recursive: true, force: true });
    }
    
    await this.serverRepository.delete(id);
    
    // Cleanup
    this.runningServers.delete(id);
    this.serverLogs.delete(id);
    
    return { message: `Server ${server.name} deleted successfully` };
  }
}
