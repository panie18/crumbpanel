import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';

@Injectable()
export class MinecraftDownloaderService {
  private readonly versionManifestUrl = 'https://piston-meta.mojang.com/mc/game/version_manifest_v2.json';
  private readonly bedrockDownloadUrl = 'https://minecraft.azureedge.net/bin-linux/bedrock-server-';

  async downloadJavaServer(version: string, serverPath: string): Promise<void> {
    console.log(`📥 [DOWNLOADER] Downloading Minecraft Java ${version}...`);
    
    try {
      // Get version manifest
      const manifestResponse = await axios.get(this.versionManifestUrl);
      const versions = manifestResponse.data.versions;
      
      // Find the specific version
      const versionInfo = versions.find((v: any) => v.id === version);
      
      if (!versionInfo) {
        throw new Error(`Version ${version} not found in manifest`);
      }

      // Get version details
      const versionResponse = await axios.get(versionInfo.url);
      const versionData = versionResponse.data;
      
      // Get server download URL
      const serverDownload = versionData.downloads?.server;
      
      if (!serverDownload) {
        throw new Error(`Server JAR not available for version ${version}`);
      }

      // Download server JAR
      const jarPath = path.join(serverPath, 'server.jar');
      await this.downloadFile(serverDownload.url, jarPath);
      
      // Create eula.txt
      const eulaPath = path.join(serverPath, 'eula.txt');
      fs.writeFileSync(eulaPath, 'eula=true\n');
      
      // Create server.properties
      await this.createServerProperties(serverPath, 'java');
      
      console.log(`✅ [DOWNLOADER] Minecraft Java ${version} downloaded successfully`);
      
    } catch (error) {
      console.error(`❌ [DOWNLOADER] Failed to download Java ${version}:`, error);
      throw new Error(`Failed to download Minecraft Java ${version}: ${error.message}`);
    }
  }

  async downloadBedrockServer(version: string, serverPath: string): Promise<void> {
    console.log(`📥 [DOWNLOADER] Downloading Minecraft Bedrock ${version}...`);
    
    try {
      // Construct Bedrock download URL
      const downloadUrl = `${this.bedrockDownloadUrl}${version}.zip`;
      const zipPath = path.join(serverPath, 'bedrock-server.zip');
      
      // Download Bedrock server
      await this.downloadFile(downloadUrl, zipPath);
      
      // Extract the ZIP file
      await this.extractZip(zipPath, serverPath);
      
      // Remove ZIP file
      fs.unlinkSync(zipPath);
      
      // Create server.properties for Bedrock
      await this.createServerProperties(serverPath, 'bedrock');
      
      console.log(`✅ [DOWNLOADER] Minecraft Bedrock ${version} downloaded successfully`);
      
    } catch (error) {
      console.error(`❌ [DOWNLOADER] Failed to download Bedrock ${version}:`, error);
      throw new Error(`Failed to download Minecraft Bedrock ${version}: ${error.message}`);
    }
  }

  private async downloadFile(url: string, filePath: string): Promise<void> {
    const response = await axios({
      method: 'GET',
      url: url,
      responseType: 'stream',
      timeout: 300000, // 5 minutes timeout
    });

    // Ensure directory exists
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    return new Promise((resolve, reject) => {
      const writer = fs.createWriteStream(filePath);
      response.data.pipe(writer);
      
      writer.on('finish', resolve);
      writer.on('error', reject);
    });
  }

  private async extractZip(zipPath: string, extractPath: string): Promise<void> {
    const AdmZip = require('adm-zip');
    const zip = new AdmZip(zipPath);
    zip.extractAllTo(extractPath, true);
  }

  private async createServerProperties(serverPath: string, serverType: 'java' | 'bedrock'): Promise<void> {
    const propertiesPath = path.join(serverPath, 'server.properties');
    
    let properties = '';
    
    if (serverType === 'java') {
      properties = `#Minecraft server properties
spawn-protection=16
max-tick-time=60000
query.port=25565
generator-settings={}
sync-chunk-writes=true
force-gamemode=false
allow-nether=true
enforce-whitelist=false
gamemode=survival
broadcast-console-to-ops=true
enable-query=false
player-idle-timeout=0
text-filtering-config=
difficulty=easy
spawn-monsters=true
broadcast-rcon-to-ops=true
op-permission-level=4
pvp=true
entity-broadcast-range-percentage=100
snooper-enabled=true
level-type=minecraft\\:normal
hardcore=false
enable-status=true
enable-command-block=false
max-players=20
network-compression-threshold=256
resource-pack-sha1=
max-world-size=29999984
function-permission-level=2
rcon.port=25575
server-port=25565
server-ip=
spawn-npcs=true
allow-flight=false
level-name=world
view-distance=10
resource-pack=
spawn-animals=true
white-list=false
rcon.password=minecraft
generate-structures=true
max-build-height=256
online-mode=true
level-seed=
prevent-proxy-connections=false
use-native-transport=true
enable-jmx-monitoring=false
motd=A Minecraft Server
rate-limit=0
enable-rcon=false
`;
    } else {
      properties = `server-name=Dedicated Server
gamemode=survival
force-gamemode=false
difficulty=easy
allow-cheats=false
max-players=10
online-mode=true
allow-list=false
server-port=19132
server-portv6=19133
view-distance=32
tick-distance=4
player-idle-timeout=30
max-threads=8
level-name=Bedrock level
level-seed=
default-player-permission-level=member
texturepack-required=false
content-log-file-enabled=false
compression-threshold=1
server-authoritative-movement=server-auth
player-movement-score-threshold=20
player-movement-action-direction-threshold=0.85
player-movement-distance-threshold=0.3
player-movement-duration-threshold-in-ms=500
correct-player-movement=false
server-authoritative-block-breaking=false
`;
    }
    
    fs.writeFileSync(propertiesPath, properties);
  }
}
