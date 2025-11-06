import { Injectable } from '@nestjs/common';
import * as https from 'https';
import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';

export interface MinecraftVersion {
  id: string;
  type: 'release' | 'snapshot' | 'old_beta' | 'old_alpha';
  url: string;
  releaseTime: string;
}

export interface VersionManifest {
  latest: {
    release: string;
    snapshot: string;
  };
  versions: MinecraftVersion[];
}

@Injectable()
export class MinecraftVersionService {
  private readonly manifestUrl = 'https://launchermeta.mojang.com/mc/game/version_manifest.json';
  private cachedManifest: VersionManifest | null = null;
  private cacheTimestamp: number = 0;
  private readonly cacheLifetime = 300000; // 5 minutes

  async getAllVersions(): Promise<VersionManifest> {
    console.log('📋 [VERSIONS] Fetching all Minecraft versions...');
    
    // Return cached manifest if still valid
    if (this.cachedManifest && (Date.now() - this.cacheTimestamp) < this.cacheLifetime) {
      console.log('✅ [VERSIONS] Using cached manifest');
      return this.cachedManifest;
    }

    try {
      const data = await this.fetchJson(this.manifestUrl);
      this.cachedManifest = data;
      this.cacheTimestamp = Date.now();
      
      console.log(`✅ [VERSIONS] Fetched ${data.versions.length} versions from Mojang`);
      console.log(`📌 [VERSIONS] Latest release: ${data.latest.release}`);
      console.log(`📌 [VERSIONS] Latest snapshot: ${data.latest.snapshot}`);
      
      return data;
    } catch (error) {
      console.error('❌ [VERSIONS] Failed to fetch manifest:', error);
      throw new Error('Failed to fetch Minecraft versions from Mojang');
    }
  }

  async getLatestReleaseVersion(): Promise<string> {
    console.log('🔍 [VERSIONS] Getting latest release version...');
    const manifest = await this.getAllVersions();
    const latest = manifest.latest.release;
    console.log(`✅ [VERSIONS] Latest release: ${latest}`);
    return latest;
  }

  async getLatestSnapshotVersion(): Promise<string> {
    console.log('🔍 [VERSIONS] Getting latest snapshot version...');
    const manifest = await this.getAllVersions();
    const latest = manifest.latest.snapshot;
    console.log(`✅ [VERSIONS] Latest snapshot: ${latest}`);
    return latest;
  }

  async getReleaseVersions(limit: number = 20): Promise<MinecraftVersion[]> {
    console.log(`📋 [VERSIONS] Getting ${limit} release versions...`);
    const manifest = await this.getAllVersions();
    const releases = manifest.versions
      .filter(v => v.type === 'release')
      .slice(0, limit);
    
    console.log(`✅ [VERSIONS] Found ${releases.length} release versions`);
    return releases;
  }

  async getVersionDetails(versionId: string): Promise<any> {
    console.log(`🔍 [VERSIONS] Getting details for version: ${versionId}`);
    
    const manifest = await this.getAllVersions();
    const versionInfo = manifest.versions.find(v => v.id === versionId);
    
    if (!versionInfo) {
      throw new Error(`Version ${versionId} not found in manifest`);
    }

    console.log(`📥 [VERSIONS] Fetching version data from: ${versionInfo.url}`);
    const versionData = await this.fetchJson(versionInfo.url);
    
    console.log(`✅ [VERSIONS] Version details fetched for ${versionId}`);
    return versionData;
  }

  async getServerDownloadUrl(versionId: string): Promise<{ url: string; sha1: string; size: number }> {
    console.log(`🔗 [VERSIONS] Getting server download URL for: ${versionId}`);
    
    const versionData = await this.getVersionDetails(versionId);
    const serverDownload = versionData.downloads?.server;
    
    if (!serverDownload) {
      throw new Error(`Server JAR not available for version ${versionId}`);
    }

    console.log(`✅ [VERSIONS] Server JAR URL: ${serverDownload.url}`);
    console.log(`📦 [VERSIONS] Size: ${(serverDownload.size / 1024 / 1024).toFixed(2)} MB`);
    
    return {
      url: serverDownload.url,
      sha1: serverDownload.sha1,
      size: serverDownload.size
    };
  }

  async downloadServerJar(versionId: string, saveDir: string): Promise<string> {
    console.log(`📥 [VERSIONS] Downloading server JAR for ${versionId}...`);
    
    // Ensure directory exists
    if (!fs.existsSync(saveDir)) {
      fs.mkdirSync(saveDir, { recursive: true });
    }

    const downloadInfo = await this.getServerDownloadUrl(versionId);
    const jarPath = path.join(saveDir, `minecraft-server-${versionId}.jar`);

    // Download the file
    await this.downloadFile(downloadInfo.url, jarPath);

    // Verify file size
    const stats = fs.statSync(jarPath);
    if (stats.size !== downloadInfo.size) {
      fs.unlinkSync(jarPath);
      throw new Error(`Downloaded file size mismatch. Expected ${downloadInfo.size}, got ${stats.size}`);
    }

    console.log(`✅ [VERSIONS] Server JAR downloaded successfully: ${jarPath}`);
    console.log(`📦 [VERSIONS] File size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
    
    return jarPath;
  }

  async downloadServerJar(version: string, targetPath: string): Promise<void> {
    console.log(`📥 Downloading Minecraft ${version} to ${targetPath}`);
    
    try {
      // Get download URL from Mojang API
      const versionManifest = await this.getVersionManifest();
      const versionData = versionManifest.versions.find(v => v.id === version);
      
      if (!versionData) {
        throw new Error(`Version ${version} not found`);
      }

      // Get version details
      const versionInfo = await axios.get(versionData.url);
      const serverUrl = versionInfo.data.downloads?.server?.url;

      if (!serverUrl) {
        throw new Error(`No server download available for version ${version}`);
      }

      // Download the JAR
      const response = await axios.get(serverUrl, {
        responseType: 'stream',
        timeout: 300000, // 5 minutes
        onDownloadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          console.log(`Download progress: ${percentCompleted}%`);
        }
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

  async searchVersions(query: string, type?: 'release' | 'snapshot'): Promise<MinecraftVersion[]> {
    console.log(`🔍 [VERSIONS] Searching for versions matching: ${query}`);
    
    const manifest = await this.getAllVersions();
    let results = manifest.versions;

    // Filter by type if specified
    if (type) {
      results = results.filter(v => v.type === type);
    }

    // Filter by query
    if (query) {
      results = results.filter(v => v.id.toLowerCase().includes(query.toLowerCase()));
    }

    console.log(`✅ [VERSIONS] Found ${results.length} matching versions`);
    return results.slice(0, 50); // Limit to 50 results
  }

  private async fetchJson(url: string): Promise<any> {
    return new Promise((resolve, reject) => {
      https.get(url, (res) => {
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
          return;
        }

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
    return new Promise((resolve, reject) => {
      const file = fs.createWriteStream(filePath);
      
      https.get(url, (response) => {
        if (response.statusCode !== 200) {
          reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
          return;
        }

        const totalBytes = parseInt(response.headers['content-length'] || '0', 10);
        let downloadedBytes = 0;

        response.on('data', (chunk) => {
          downloadedBytes += chunk.length;
          const progress = ((downloadedBytes / totalBytes) * 100).toFixed(1);
          if (downloadedBytes % (1024 * 1024 * 5) === 0) { // Log every 5MB
            console.log(`📥 [DOWNLOAD] Progress: ${progress}% (${(downloadedBytes / 1024 / 1024).toFixed(2)} MB)`);
          }
        });

        response.pipe(file);
        
        file.on('finish', () => {
          file.close();
          console.log(`✅ [DOWNLOAD] Complete: ${(downloadedBytes / 1024 / 1024).toFixed(2)} MB`);
          resolve();
        });
        
        file.on('error', (error) => {
          fs.unlink(filePath, () => {});
          reject(error);
        });
      }).on('error', (error) => {
        fs.unlink(filePath, () => {});
        reject(error);
      });
    });
  }
}
