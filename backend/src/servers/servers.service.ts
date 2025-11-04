import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Server } from '../entities/server.entity';
import { CreateServerDto, UpdateServerDto } from './dto/server.dto';
import { RconService } from './rcon.service';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';

const execAsync = promisify(exec);

@Injectable()
export class ServersService {
  constructor(
    @InjectRepository(Server)
    private serverRepository: Repository<Server>,
    private rconService: RconService,
  ) {}

  async findAll() {
    return this.serverRepository.find({
      relations: ['players', 'backups'],
    });
  }

  async findOne(id: string) {
    const server = await this.serverRepository.findOne({
      where: { id },
      relations: ['players', 'backups'],
    });

    if (!server) {
      throw new NotFoundException('Server not found');
    }

    return server;
  }

  async create(dto: CreateServerDto) {
    const encryptedPassword = this.encryptPassword(dto.rconPassword);
    
    const serverPath = path.join('/app/servers', dto.name.replace(/\s+/g, '_'));
    await fs.mkdir(serverPath, { recursive: true });

    const server = await this.serverRepository.save({
      name: dto.name,
      port: dto.port,
      rconPort: dto.rconPort,
      rconPassword: encryptedPassword,
      version: dto.version,
      maxRam: dto.maxRam,
      path: serverPath,
    });

    // Create server.properties
    await this.createServerProperties(server);

    return server;
  }

  async update(id: string, dto: UpdateServerDto) {
    const data: any = { ...dto };
    
    if (dto.rconPassword) {
      data.rconPassword = this.encryptPassword(dto.rconPassword);
    }

    return this.serverRepository.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    const server = await this.findOne(id);
    
    // Delete server files
    try {
      await fs.rm(server.path, { recursive: true, force: true });
    } catch (error) {
      console.error('Error deleting server files:', error);
    }

    return this.serverRepository.delete({
      where: { id },
    });
  }

  async start(id: string) {
    const server = await this.findOne(id);
    
    await this.serverRepository.update({
      where: { id },
      data: { status: 'STARTING' },
    });

    try {
      const javaArgs = server.javaArgs || '-Xmx2G -Xms1G';
      const command = `cd ${server.path} && screen -dmS mc_${id} java ${javaArgs} -jar server.jar nogui`;
      
      await execAsync(command);

      // Wait for server to start
      await new Promise(resolve => setTimeout(resolve, 5000));

      await this.serverRepository.update({
        where: { id },
        data: { status: 'RUNNING' },
      });

      return { message: 'Server started successfully' };
    } catch (error) {
      await this.serverRepository.update({
        where: { id },
        data: { status: 'ERROR' },
      });
      throw error;
    }
  }

  async stop(id: string) {
    const server = await this.findOne(id);
    
    await this.serverRepository.update({
      where: { id },
      data: { status: 'STOPPING' },
    });

    try {
      await this.rconService.sendCommand(server, 'stop');
      
      await new Promise(resolve => setTimeout(resolve, 3000));

      await this.serverRepository.update({
        where: { id },
        data: { status: 'STOPPED' },
      });

      return { message: 'Server stopped successfully' };
    } catch (error) {
      throw error;
    }
  }

  async restart(id: string) {
    await this.stop(id);
    await new Promise(resolve => setTimeout(resolve, 2000));
    return this.start(id);
  }

  async getStatus(id: string) {
    const server = await this.findOne(id);
    const isRunning = await this.checkIfRunning(server);

    if (isRunning !== (server.status === 'RUNNING')) {
      await this.serverRepository.update({
        where: { id },
        data: { status: isRunning ? 'RUNNING' : 'STOPPED' },
      });
    }

    return {
      status: isRunning ? 'RUNNING' : 'STOPPED',
      isRunning,
    };
  }

  private async checkIfRunning(server: any): Promise<boolean> {
    try {
      const { stdout } = await execAsync(`screen -ls | grep mc_${server.id}`);
      return stdout.length > 0;
    } catch {
      return false;
    }
  }

  private encryptPassword(password: string): string {
    const algorithm = 'aes-256-cbc';
    const key = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');
    const iv = crypto.randomBytes(16);
    
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(password, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return `${iv.toString('hex')}:${encrypted}`;
  }

  decryptPassword(encrypted: string): string {
    const algorithm = 'aes-256-cbc';
    const key = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');
    const [ivHex, encryptedText] = encrypted.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  private async createServerProperties(server: any) {
    const properties = `
server-port=${server.port}
rcon.port=${server.rconPort}
rcon.password=${this.decryptPassword(server.rconPassword)}
enable-rcon=true
max-players=20
motd=§6${server.name}
    `.trim();

    await fs.writeFile(
      path.join(server.path, 'server.properties'),
      properties,
    );

    // Accept EULA
    await fs.writeFile(
      path.join(server.path, 'eula.txt'),
      'eula=true',
    );
  }
}
