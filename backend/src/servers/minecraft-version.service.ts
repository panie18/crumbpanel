import { Injectable } from '@nestjs/common';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class MinecraftVersionService {
  private readonly MOJANG_MANIFEST_URL = 'https://launchermeta.mojang.com/mc/game/version_manifest.json';

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

  async getLatestReleaseVersion(): Promise<string> {
    const latest = await this.getLatestVersion();
    return latest.release;
  }

  async getLatestSnapshotVersion(): Promise<string> {
    const latest = await this.getLatestVersion();
    return latest.snapshot;
  }

  async getAllVersions() {
    const manifest = await this.getVersionManifest();
    return manifest.versions;
  }

  async getReleaseVersions(limit: number = 30) {
    try {
      const manifest = await this.getVersionManifest();
      return manifest.versions
        .filter((v: any) => v.type === 'release')
        .slice(0, limit);
    } catch (error) {
      console.error('Failed to fetch versions', error);
      return [];
    }
  }

  async searchVersions(query: string, type?: string) {
    const manifest = await this.getVersionManifest();
    let versions = manifest.versions;

    if (type) {
      versions = versions.filter((v: any) => v.type === type);
    }

    if (query) {
      versions = versions.filter((v: any) => 
        v.id.toLowerCase().includes(query.toLowerCase())
      );
    }

    return versions.slice(0, 50);
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
