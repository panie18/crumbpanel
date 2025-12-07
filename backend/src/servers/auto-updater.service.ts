import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Server } from '../entities/server.entity';
import { MinecraftVersionService } from './minecraft-version.service';
import * as fs from 'fs';
import * as path from 'path';

export interface UpdateInfo {
  serverId: string;
  currentVersion: string;
  latestVersion: string;
  canUpdate: boolean;
  changelog?: string;
}

@Injectable()
export class AutoUpdaterService {
  constructor(
    @InjectRepository(Server)
    private serverRepository: Repository<Server>,
    private versionService: MinecraftVersionService,
  ) {}

  /**
   * Check if server can be updated
   */
  async checkForUpdate(serverId: string): Promise<UpdateInfo> {
    const server = await this.serverRepository.findOne({ where: { id: serverId } });
    if (!server) {
      throw new Error('Server not found');
    }

    const latestVersion = await this.versionService.getLatestReleaseVersion();
    
    return {
      serverId,
      currentVersion: server.version,
      latestVersion,
      canUpdate: server.version !== latestVersion,
      changelog: await this.getChangelog(server.version, latestVersion)
    };
  }

  /**
   * Perform server update
   */
  async updateServer(serverId: string, targetVersion: string): Promise<void> {
    console.log(`🔄 [AUTO-UPDATER] Updating server ${serverId} to ${targetVersion}`);

    const server = await this.serverRepository.findOne({ where: { id: serverId } });
    if (!server) {
      throw new Error('Server not found');
    }

    // 1. Backup current server JAR
    const currentJar = path.join(server.serverPath, 'server.jar');
    const backupJar = path.join(server.serverPath, 'server.jar.backup');
    
    if (fs.existsSync(currentJar)) {
      fs.copyFileSync(currentJar, backupJar);
      console.log('✅ [AUTO-UPDATER] Current JAR backed up');
    }

    // 2. Download new version
    try {
      await this.versionService.downloadServerJar(targetVersion, server.serverPath);
      console.log('✅ [AUTO-UPDATER] New version downloaded');
    } catch (error) {
      console.error('❌ [AUTO-UPDATER] Download failed, restoring backup');
      if (fs.existsSync(backupJar)) {
        fs.copyFileSync(backupJar, currentJar);
      }
      throw error;
    }

    // 3. Update database
    await this.serverRepository.update(serverId, { version: targetVersion });
    console.log('✅ [AUTO-UPDATER] Server updated successfully');

    // 4. Cleanup backup
    if (fs.existsSync(backupJar)) {
      fs.unlinkSync(backupJar);
    }
  }

  private async getChangelog(fromVersion: string, toVersion: string): Promise<string> {
    // TODO: Fetch actual changelog from Minecraft wiki or official sources
    return `Updated from ${fromVersion} to ${toVersion}\n\n` +
           `🎉 New features and bug fixes in ${toVersion}:\n` +
           `- Performance improvements\n` +
           `- Bug fixes\n` +
           `- New blocks and items\n`;
  }
}
