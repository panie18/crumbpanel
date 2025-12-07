import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class MinecraftVersionService {
  private cachedManifest: any | null = null;
  private lastFetch: number = 0;
  private CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache

  private async fetchVersionsManifest(): Promise<{ versions: any[] }> {
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
}
