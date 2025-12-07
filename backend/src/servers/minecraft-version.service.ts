import { Injectable } from '@nestjs/common';

@Injectable()
export class MinecraftVersionService {
  private cachedManifest: any | null = null;

  private async fetchVersionsManifest(): Promise<{ versions: any[] }> {
    // Platzhalter: gibt ein leeres Manifest zurück
    if (!this.cachedManifest) {
      this.cachedManifest = { versions: [] };
    }
    return this.cachedManifest;
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
}
