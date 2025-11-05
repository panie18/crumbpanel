import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { MinecraftVersionService } from './minecraft-version.service';

export interface VersionUpdate {
  currentVersion: string;
  latestVersion: string;
  updateAvailable: boolean;
  releaseDate?: string;
  changelog?: string;
}

@Injectable()
export class VersionCheckerService {
  private latestVersionCache: string = '';
  private lastCheck: number = 0;

  constructor(private versionService: MinecraftVersionService) {}

  /**
   * Check for updates every 6 hours
   */
  @Cron(CronExpression.EVERY_6_HOURS)
  async checkForUpdates() {
    try {
      console.log('🔄 [VERSION-CHECKER] Checking for Minecraft updates...');
      
      const latest = await this.versionService.getLatestReleaseVersion();
      
      if (latest !== this.latestVersionCache) {
        console.log(`✨ [VERSION-CHECKER] New version available: ${latest} (was: ${this.latestVersionCache})`);
        this.latestVersionCache = latest;
        this.lastCheck = Date.now();
        
        // TODO: Send notification to admins
      }
    } catch (error) {
      console.error('❌ [VERSION-CHECKER] Failed to check for updates:', error);
    }
  }

  async checkServerUpdate(currentVersion: string): Promise<VersionUpdate> {
    const latestVersion = await this.versionService.getLatestReleaseVersion();
    
    return {
      currentVersion,
      latestVersion,
      updateAvailable: currentVersion !== latestVersion,
      releaseDate: new Date().toISOString() // TODO: Get from API
    };
  }
}
