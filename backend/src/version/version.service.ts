import { Injectable } from '@nestjs/common';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as https from 'https';

export interface MinecraftVersion {
  id: string;
  type: 'release' | 'snapshot' | 'old_beta' | 'old_alpha';
  url: string;
  time: string;
  releaseTime: string;
}

@Injectable()
export class VersionService {
  private readonly mojangManifestUrl = 'https://piston-meta.mojang.com/mc/game/version_manifest_v2.json';
  private readonly paperApiUrl = 'https://api.papermc.io/v2';
  
  async getMinecraftVersions(): Promise<MinecraftVersion[]> {
    console.log('📋 [VERSION] Fetching Minecraft versions...');
    
    try {
      const manifest = await this.fetchJson(this.mojangManifestUrl);
      return manifest.versions.filter((v: any) => v.type === 'release').slice(0, 20);
    } catch (error) {
      console.error('❌ [VERSION] Failed to fetch versions:', error);
      return [];
    }
  }

  async getPaperVersions(): Promise<string[]> {
    console.log('📋 [VERSION] Fetching Paper versions...');
    
    try {
      const response = await this.fetchJson(`${this.paperApiUrl}/projects/paper`);
      return response.versions.reverse().slice(0, 10); // Latest 10 versions
    } catch (error) {
      console.error('❌ [VERSION] Failed to fetch Paper versions:', error);
      return [];
    }
  }

  async downloadServerJar(
    serverType: 'vanilla' | 'paper' | 'fabric',
    version: string,
    serverPath: string
  ): Promise<string> {
    console.log(`📥 [VERSION] Downloading ${serverType} ${version}...`);
    
    let downloadUrl: string;
    let fileName: string;

    switch (serverType) {
      case 'vanilla':
        const versionData = await this.getVanillaDownloadUrl(version);
        downloadUrl = versionData.url;
        fileName = `minecraft-server-${version}.jar`;
        break;
        
      case 'paper':
        const paperData = await this.getPaperDownloadUrl(version);
        downloadUrl = paperData.url;
        fileName = paperData.fileName;
        break;
        
      case 'fabric':
        downloadUrl = `https://meta.fabricmc.net/v2/versions/loader/${version}/stable/server/jar`;
        fileName = `fabric-server-${version}.jar`;
        break;
        
      default:
        throw new Error(`Unsupported server type: ${serverType}`);
    }

    const jarPath = path.join(serverPath, fileName);
    await this.downloadFile(downloadUrl, jarPath);
    
    console.log(`✅ [VERSION] Downloaded ${fileName}`);
    return jarPath;
  }

  private async getVanillaDownloadUrl(version: string): Promise<{ url: string }> {
    const manifest = await this.fetchJson(this.mojangManifestUrl);
    const versionInfo = manifest.versions.find((v: any) => v.id === version);
    
    if (!versionInfo) {
      throw new Error(`Version ${version} not found`);
    }

    const versionData = await this.fetchJson(versionInfo.url);
    const serverDownload = versionData.downloads?.server;
    
    if (!serverDownload) {
      throw new Error(`Server JAR not available for version ${version}`);
    }

    return { url: serverDownload.url };
  }

  private async getPaperDownloadUrl(version: string): Promise<{ url: string; fileName: string }> {
    // Get latest build for version
    const buildsResponse = await this.fetchJson(`${this.paperApiUrl}/projects/paper/versions/${version}`);
    const latestBuild = buildsResponse.builds[buildsResponse.builds.length - 1];
    
    // Get download info
    const buildResponse = await this.fetchJson(
      `${this.paperApiUrl}/projects/paper/versions/${version}/builds/${latestBuild}`
    );
    
    const download = buildResponse.downloads.application;
    const fileName = download.name;
    const url = `${this.paperApiUrl}/projects/paper/versions/${version}/builds/${latestBuild}/downloads/${fileName}`;
    
    return { url, fileName };
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
    await fs.ensureDir(path.dirname(filePath));
    
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
