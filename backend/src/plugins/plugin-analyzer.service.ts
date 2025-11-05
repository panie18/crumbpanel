import { Injectable } from '@nestjs/common';
import * as AdmZip from 'adm-zip';
import * as yaml from 'js-yaml';

export interface PluginMetadata {
  name: string;
  version: string;
  main: string;
  description?: string;
  author?: string;
  authors?: string[];
  website?: string;
  depend?: string[];
  softdepend?: string[];
  loadbefore?: string[];
  commands?: Record<string, any>;
  permissions?: Record<string, any>;
  apiVersion?: string;
}

@Injectable()
export class PluginAnalyzerService {
  
  /**
   * Extract plugin.yml from JAR file and parse metadata
   */
  async analyzePluginJar(jarPath: string): Promise<PluginMetadata | null> {
    try {
      console.log('🔍 [PLUGIN-ANALYZER] Analyzing JAR:', jarPath);
      
      const zip = new AdmZip(jarPath);
      const pluginYmlEntry = zip.getEntry('plugin.yml');
      
      if (!pluginYmlEntry) {
        console.warn('⚠️ [PLUGIN-ANALYZER] No plugin.yml found in JAR');
        return null;
      }

      const pluginYmlContent = pluginYmlEntry.getData().toString('utf8');
      const metadata = yaml.load(pluginYmlContent) as PluginMetadata;
      
      console.log('✅ [PLUGIN-ANALYZER] Plugin analyzed:', metadata.name, 'v' + metadata.version);
      
      return metadata;
    } catch (error) {
      console.error('❌ [PLUGIN-ANALYZER] Failed to analyze plugin:', error);
      return null;
    }
  }

  /**
   * Check if plugin is compatible with Minecraft version
   */
  isCompatibleWithVersion(pluginMetadata: PluginMetadata, minecraftVersion: string): boolean {
    if (!pluginMetadata.apiVersion) {
      // No API version specified, assume compatible
      return true;
    }

    const mcMajor = this.parseMajorVersion(minecraftVersion);
    const apiMajor = this.parseMajorVersion(pluginMetadata.apiVersion);
    
    // Compatible if API version matches or is lower
    return apiMajor <= mcMajor;
  }

  private parseMajorVersion(version: string): number {
    const match = version.match(/^1\.(\d+)/);
    return match ? parseInt(match[1]) : 0;
  }

  /**
   * Get plugin dependencies
   */
  getDependencies(metadata: PluginMetadata): {
    required: string[];
    optional: string[];
  } {
    return {
      required: metadata.depend || [],
      optional: [...(metadata.softdepend || []), ...(metadata.loadbefore || [])]
    };
  }

  /**
   * Extract commands from plugin metadata
   */
  getCommands(metadata: PluginMetadata): string[] {
    if (!metadata.commands) return [];
    return Object.keys(metadata.commands);
  }
}
