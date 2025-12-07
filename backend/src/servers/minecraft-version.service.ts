import { Injectable } from '@nestjs/common';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';

@Injectable()
export class MinecraftVersionService {
  private cachedManifest: any | null = null;
  private lastFetch: number = 0;
  private CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache

  private async fetchVersionsManifest(): Promise<{ latest?: { release: string; snapshot: string }; versions: any[] }> {
    const now = Date.now();
    
    // Check cache
    if (this.cachedManifest && (now - this.lastFetch) < this.CACHE_TTL) {
      console.log('📋 [VERSIONS] Using cached manifest');
      return this.cachedManifest;
    }

    try {
      console.log('📋 [VERSIONS] Fetching from Mojang API...');
      const response = await axios.get('https://launchermeta.mojang.com/mc/game/version_manifest.json', {
        timeout: 10000,
        headers: {
          'User-Agent': 'CrumbPanel/1.0'
        }
      });
      
      this.cachedManifest = response.data;
      this.lastFetch = now;
      
      console.log(`✅ [VERSIONS] Loaded ${response.data.versions.length} versions from Mojang`);
      return response.data;
      
    } catch (error) {
      console.error('❌ [VERSIONS] Failed to fetch from Mojang:', error.message);
      
      // Fallback data
      if (!this.cachedManifest) {
        this.cachedManifest = {
          latest: { release: '1.21.4', snapshot: '24w14a' },
          versions: [
            { id: '1.21.4', type: 'release', url: '', time: '2024-12-01T00:00:00Z', releaseTime: '2024-12-01T00:00:00Z' },
            { id: '1.21.3', type: 'release', url: '', time: '2024-10-01T00:00:00Z', releaseTime: '2024-10-01T00:00:00Z' },
            { id: '1.21.1', type: 'release', url: '', time: '2024-08-01T00:00:00Z', releaseTime: '2024-08-01T00:00:00Z' },
            { id: '1.20.6', type: 'release', url: '', time: '2024-06-01T00:00:00Z', releaseTime: '2024-06-01T00:00:00Z' },
            { id: '1.20.4', type: 'release', url: '', time: '2024-01-01T00:00:00Z', releaseTime: '2024-01-01T00:00:00Z' },
          ]
        };
      }
      
      return this.cachedManifest;
    }
  }

  async getLatestReleaseVersion(): Promise<string> {
    try {
      const manifest = await this.fetchVersionsManifest();
      return manifest.latest?.release || manifest.versions.find(v => v.type === 'release')?.id || '1.21.4';
    } catch (error) {
      console.error('❌ [VERSIONS] getLatestReleaseVersion error:', error);
      return '1.21.4';
    }
  }

  async getLatestSnapshotVersion(): Promise<string> {
    try {
      const manifest = await this.fetchVersionsManifest();
      return manifest.latest?.snapshot || manifest.versions.find(v => v.type === 'snapshot')?.id || '24w14a';
    } catch (error) {
      return '24w14a';
    }
  }

  async getReleaseVersions(limit: number = 30): Promise<any[]> {
    try {
      const manifest = await this.fetchVersionsManifest();
      return manifest.versions
        .filter((v: any) => v.type === 'release')
        .slice(0, limit)
        .map((v: any) => ({
          id: v.id,
          type: v.type,
          releaseTime: v.releaseTime,
          url: v.url
        }));
    } catch (error) {
      console.error('❌ [VERSIONS] getReleaseVersions error:', error);
      return [];
    }
  }

  async searchVersions(query: string, type?: 'release' | 'snapshot'): Promise<any[]> {
    try {
      const manifest = await this.fetchVersionsManifest();
      return manifest.versions.filter((v: any) => {
        const matchesQuery = v.id?.toLowerCase().includes(query.toLowerCase());
        const matchesType = type ? v.type === type : true;
        return matchesQuery && matchesType;
      }).slice(0, 20);
    } catch (error) {
      return [];
    }
  }

  /**
   * Download Minecraft server JAR file
   */
  async downloadServerJar(version: string, serverPath: string): Promise<string> {
    console.log(`📥 [VERSIONS] Downloading server JAR for version ${version}...`);
    
    try {
      const manifest = await this.fetchVersionsManifest();
      const versionInfo = manifest.versions.find((v: any) => v.id === version);
      
      if (!versionInfo) {
        throw new Error(`Version ${version} not found in manifest`);
      }

      // Fetch version-specific data
      const versionData = await this.fetchJson(versionInfo.url);
      const serverDownload = versionData.downloads?.server;
      
      if (!serverDownload) {
        throw new Error(`Server JAR not available for version ${version}`);
      }

      // Download server JAR
      const jarPath = path.join(serverPath, 'server.jar');
      await this.downloadFile(serverDownload.url, jarPath);
      
      console.log(`✅ [VERSIONS] Server JAR downloaded successfully`);
      return jarPath;
      
    } catch (error) {
      console.error(`❌ [VERSIONS] Failed to download server JAR:`, error);
      throw error;
    }
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

  private async downloadFile(url: string, filePath: string): Promise<void> {
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
}
