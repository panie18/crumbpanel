import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { spawn, ChildProcess } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import { Server } from '../entities/server.entity';

@Injectable()
export class ServerManagerService {
  private runningServers = new Map<string, ChildProcess>();

  constructor(
    @InjectRepository(Server)
    private serverRepository: Repository<Server>,
  ) {}

  async startServer(serverId: string): Promise<void> {
    console.log(`🚀 [SERVER-MANAGER] Starting server ${serverId}...`);
    
    try {
      const server = await this.serverRepository.findOne({ where: { id: serverId } });
      if (!server) {
        throw new Error('Server not found');
      }

      if (this.runningServers.has(serverId)) {
        throw new Error('Server is already running');
      }

      const serverPath = path.join('/app/servers', server.name.replace(/[^a-zA-Z0-9]/g, '_'));
      
      if (!fs.existsSync(serverPath)) {
        throw new Error('Server files not found');
      }

      // Update status to STARTING
      await this.serverRepository.update(serverId, { status: 'STARTING' });

      let serverProcess: ChildProcess;

      if (server.serverType === 'java') {
        // Start Java server
        const jarPath = path.join(serverPath, 'server.jar');
        
        if (!fs.existsSync(jarPath)) {
          throw new Error('Server JAR file not found');
        }

        serverProcess = spawn('java', [
          `-Xmx${server.maxRam}G`,
          `-Xms${Math.min(server.maxRam, 1)}G`,
          '-jar',
          'server.jar',
          'nogui'
        ], {
          cwd: serverPath,
          stdio: ['pipe', 'pipe', 'pipe']
        });

      } else {
        // Start Bedrock server
        const bedrockExecutable = path.join(serverPath, 'bedrock_server');
        
        if (!fs.existsSync(bedrockExecutable)) {
          throw new Error('Bedrock server executable not found');
        }

        // Make executable
        fs.chmodSync(bedrockExecutable, '755');

        serverProcess = spawn('./bedrock_server', [], {
          cwd: serverPath,
          stdio: ['pipe', 'pipe', 'pipe']
        });
      }

      // Store the process
      this.runningServers.set(serverId, serverProcess);

      // Handle server output
      serverProcess.stdout?.on('data', (data) => {
        const output = data.toString();
        console.log(`[${server.name}] ${output.trim()}`);
        
        // Check if server is ready
        if (output.includes('Done') || output.includes('Server started')) {
          this.serverRepository.update(serverId, { status: 'RUNNING' });
          console.log(`✅ [SERVER-MANAGER] Server ${server.name} is now running`);
        }
      });

      serverProcess.stderr?.on('data', (data) => {
        console.error(`[${server.name}] ERROR: ${data.toString().trim()}`);
      });

      // Handle server exit
      serverProcess.on('close', (code) => {
        console.log(`🛑 [SERVER-MANAGER] Server ${server.name} exited with code ${code}`);
        this.runningServers.delete(serverId);
        this.serverRepository.update(serverId, { status: 'STOPPED' });
      });

      serverProcess.on('error', (error) => {
        console.error(`❌ [SERVER-MANAGER] Server ${server.name} error:`, error);
        this.runningServers.delete(serverId);
        this.serverRepository.update(serverId, { status: 'STOPPED' });
      });

      console.log(`🚀 [SERVER-MANAGER] Server ${server.name} process started`);

    } catch (error) {
      console.error(`❌ [SERVER-MANAGER] Failed to start server ${serverId}:`, error);
      await this.serverRepository.update(serverId, { status: 'STOPPED' });
      throw error;
    }
  }

  async stopServer(serverId: string): Promise<void> {
    console.log(`🛑 [SERVER-MANAGER] Stopping server ${serverId}...`);
    
    try {
      const server = await this.serverRepository.findOne({ where: { id: serverId } });
      if (!server) {
        throw new Error('Server not found');
      }

      const serverProcess = this.runningServers.get(serverId);
      
      if (!serverProcess) {
        await this.serverRepository.update(serverId, { status: 'STOPPED' });
        return;
      }

      // Update status to STOPPING
      await this.serverRepository.update(serverId, { status: 'STOPPING' });

      // Send stop command to server
      if (server.serverType === 'java') {
        serverProcess.stdin?.write('stop\n');
      } else {
        serverProcess.stdin?.write('stop\n');
      }

      // Wait for graceful shutdown, then force kill if needed
      setTimeout(() => {
        if (this.runningServers.has(serverId)) {
          console.log(`🔪 [SERVER-MANAGER] Force killing server ${server.name}`);
          serverProcess.kill('SIGKILL');
        }
      }, 10000); // 10 seconds grace period

    } catch (error) {
      console.error(`❌ [SERVER-MANAGER] Failed to stop server ${serverId}:`, error);
      throw error;
    }
  }

  async restartServer(serverId: string): Promise<void> {
    console.log(`🔄 [SERVER-MANAGER] Restarting server ${serverId}...`);
    
    await this.stopServer(serverId);
    
    // Wait for server to fully stop
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    await this.startServer(serverId);
  }

  async sendCommand(serverId: string, command: string): Promise<void> {
    const serverProcess = this.runningServers.get(serverId);
    
    if (!serverProcess) {
      throw new Error('Server is not running');
    }

    console.log(`📝 [SERVER-MANAGER] Sending command to ${serverId}: ${command}`);
    serverProcess.stdin?.write(`${command}\n`);
  }

  isServerRunning(serverId: string): boolean {
    return this.runningServers.has(serverId);
  }
}
