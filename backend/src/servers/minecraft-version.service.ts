import { Injectable } from '@nestjs/common';

@Injectable()
export class MinecraftVersionService {
  private cachedManifest: any | null = null;
  private lastFetch: number = 0;
  private CACHE_TTL = 5 * 60 * 1000; // 5 Minuten Cache

  private async fetchVersionsManifest(): Promise<{ versions: any[] }> {
    const now = Date.now();
    
    // Cache prüfen
    if (this.cachedManifest && (now - this.lastFetch) < this.CACHE_TTL) {
      return this.cachedManifest;
    }

    try {
      // Echte Mojang API
      const response = await fetch('https://launchermeta.mojang.com/mc/game/version_manifest.json');
      const data = await response.json();
      
      this.cachedManifest = data;
      this.lastFetch = now;
      
      return data;
    } catch (error) {
      console.error('[MinecraftVersionService] Failed to fetch from Mojang API:', error);
      
      // Fallback: Dummy-Daten
      if (!this.cachedManifest) {
        this.cachedManifest = {
          versions: [
            { id: '1.20.4', type: 'release', url: '', time: '2024-01-01T00:00:00Z' },
            { id: '1.20.3', type: 'release', url: '', time: '2023-12-01T00:00:00Z' },
            { id: '1.20.2', type: 'release', url: '', time: '2023-11-01T00:00:00Z' },
            { id: '1.20.1', type: 'release', url: '', time: '2023-10-01T00:00:00Z' },
            { id: '1.19.4', type: 'release', url: '', time: '2023-09-01T00:00:00Z' },
          ]
        };
      }
      
      return this.cachedManifest;
    }
  }

  async getLatestReleaseVersion(): Promise<string | null> {
    const manifest = await this.fetchVersionsManifest();
    const release = manifest.versions.find((v: any) => v.type === 'release');
    return release?.id ?? null;
  }

  async getLatestSnapshotVersion(): Promise<string | null> {
    const manifest = await this.fetchVersionsManifest();
    const snapshot = manifest.versions.find((v: any) => v.type === 'snapshot');
    return snapshot?.id ?? null;
  }

  async getReleaseVersions(limit: number = 30): Promise<any[]> {
    const manifest = await this.fetchVersionsManifest();
    return manifest.versions
      .filter((v: any) => v.type === 'release')
      .slice(0, limit);
  }

  async searchVersions(query: string, type?: 'release' | 'snapshot'): Promise<any[]> {
    const manifest = await this.fetchVersionsManifest();
    return manifest.versions.filter((v: any) => {
      const matchesQuery = v.id?.toLowerCase().includes(query.toLowerCase());
      const matchesType = type ? v.type === type : true;
      return matchesQuery && matchesType;
    });
  }

  async downloadServerJar(version: string, targetPath: string): Promise<void> {
    console.log(`[MinecraftVersionService] Downloading server.jar for version ${version} to ${targetPath}`);
    
    // TODO: Echten Download implementieren
    // 1. Version Manifest abrufen
    // 2. Version-spezifisches JSON laden (enthält server.jar URL)
    // 3. server.jar runterladen nach targetPath
    
    return Promise.resolve();
  }
}
