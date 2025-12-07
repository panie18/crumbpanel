import { Injectable } from '@nestjs/common';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class MinecraftVersionService {
  private readonly MOJANG_MANIFEST_URL = 'https://launchermeta.mojang.com/mc/game/version_manifest.json';

  private cachedManifest: any | null = null;

  private async fetchVersionsManifest(): Promise<{ versions: any[] }> {
    // Platzhalter: gibt ein leeres Manifest zurück,
    // damit Aufrufe wie getReleaseVersions() nicht crashen.
    if (!this.cachedManifest) {
      this.cachedManifest = { versions: [] };
    }
    return this.cachedManifest;
  }

  async getVersionManifest() {
    try {
      const response = await axios.get(this.MOJANG_MANIFEST_URL);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch version manifest:', error);
      throw error;
    }
  }

  async getLatestVersion() {
    const manifest = await this.getVersionManifest();
    return {
      release: manifest.latest.release,
      snapshot: manifest.latest.snapshot,
    };
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

  async getAllVersions() {
    const manifest = await this.getVersionManifest();
    return manifest.versions;
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
    console.log(`📥 Downloading Minecraft ${version} to ${targetPath}`);
    
    try {
      const versionManifest = await this.getVersionManifest();
      const versionData = versionManifest.versions.find((v: any) => v.id === version);
      
      if (!versionData) {
        throw new Error(`Version ${version} not found`);
      }

      const versionInfo = await axios.get(versionData.url);
      const serverUrl = versionInfo.data.downloads?.server?.url;

      if (!serverUrl) {
        throw new Error(`No server download available for version ${version}`);
      }

      const response = await axios.get(serverUrl, {
        responseType: 'stream',
        timeout: 300000,
      });

      const jarPath = path.join(targetPath, `minecraft-server-${version}.jar`);
      const writer = fs.createWriteStream(jarPath);

      response.data.pipe(writer);

      return new Promise((resolve, reject) => {
        writer.on('finish', () => {
          console.log('✅ Download complete');
          resolve();
        });
        writer.on('error', reject);
      });

    } catch (error) {
      console.error('❌ Download failed:', error);
      throw new Error(`Failed to download server JAR: ${error.message}`);
    }
  }
}
