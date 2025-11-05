import { Injectable } from '@nestjs/common';

export interface LogAnalysis {
  severity: 'info' | 'warning' | 'error' | 'critical';
  category: 'performance' | 'crash' | 'plugin' | 'chunk' | 'network' | 'general';
  message: string;
  suggestion?: string;
  timestamp: Date;
}

@Injectable()
export class LogAnalyzerService {
  
  /**
   * Analyze log line and provide human-readable diagnosis
   */
  analyzeLine(logLine: string): LogAnalysis | null {
    const timestamp = new Date();

    // Performance Issues
    if (logLine.includes('Can\'t keep up') || logLine.includes('running') && logLine.includes('behind')) {
      return {
        severity: 'warning',
        category: 'performance',
        message: 'Server is lagging behind - TPS dropping',
        suggestion: '💡 Reduce view-distance, optimize chunk loading, or allocate more RAM',
        timestamp
      };
    }

    if (logLine.includes('OutOfMemoryError')) {
      return {
        severity: 'critical',
        category: 'performance',
        message: 'Server ran out of memory!',
        suggestion: '🔥 CRITICAL: Increase max RAM in server settings immediately',
        timestamp
      };
    }

    // Plugin Errors
    if (logLine.match(/Could not load '.*\.jar'/)) {
      const pluginMatch = logLine.match(/Could not load '(.*?)'/);
      return {
        severity: 'error',
        category: 'plugin',
        message: `Failed to load plugin: ${pluginMatch?.[1] || 'unknown'}`,
        suggestion: '🔌 Check if plugin is compatible with your Minecraft version',
        timestamp
      };
    }

    if (logLine.includes('enabling') && logLine.includes('FAILED')) {
      return {
        severity: 'error',
        category: 'plugin',
        message: 'Plugin failed to enable',
        suggestion: '📦 Check plugin dependencies and configuration files',
        timestamp
      };
    }

    // Chunk Loading Issues
    if (logLine.includes('Caused by') && logLine.includes('chunk')) {
      return {
        severity: 'warning',
        category: 'chunk',
        message: 'Chunk loading error detected',
        suggestion: '🗺️ Your server is lagging due to chunk-loading issues. Try reducing render distance.',
        timestamp
      };
    }

    // Network/Connection
    if (logLine.includes('IOException') || logLine.includes('Connection reset')) {
      return {
        severity: 'warning',
        category: 'network',
        message: 'Network connection issue detected',
        suggestion: '🌐 Check firewall settings and network stability',
        timestamp
      };
    }

    // Crash Detection
    if (logLine.includes('Crash report') || logLine.includes('Exception in server tick loop')) {
      return {
        severity: 'critical',
        category: 'crash',
        message: 'Server crash detected!',
        suggestion: '💥 Server crashed - check full logs for stack trace. Common causes: corrupted chunks, incompatible plugins.',
        timestamp
      };
    }

    // Warnings
    if (logLine.includes('[WARN]') && logLine.includes('deprecated')) {
      return {
        severity: 'warning',
        category: 'general',
        message: 'Using deprecated API',
        suggestion: '📚 Update your plugins to newer versions',
        timestamp
      };
    }

    return null;
  }

  /**
   * Analyze multiple log lines and generate summary
   */
  analyzeLogSummary(logs: string[]): {
    criticalIssues: number;
    warnings: number;
    topIssues: LogAnalysis[];
  } {
    const analyses: LogAnalysis[] = [];
    
    logs.forEach(log => {
      const analysis = this.analyzeLine(log);
      if (analysis) {
        analyses.push(analysis);
      }
    });

    const critical = analyses.filter(a => a.severity === 'critical').length;
    const warnings = analyses.filter(a => a.severity === 'warning' || a.severity === 'error').length;

    // Get top 5 most important issues
    const topIssues = analyses
      .sort((a, b) => {
        const severityOrder = { critical: 0, error: 1, warning: 2, info: 3 };
        return severityOrder[a.severity] - severityOrder[b.severity];
      })
      .slice(0, 5);

    return {
      criticalIssues: critical,
      warnings,
      topIssues
    };
  }

  /**
   * Generate performance recommendations based on logs
   */
  generatePerformanceRecommendations(logs: string[]): string[] {
    const recommendations: string[] = [];
    const logText = logs.join('\n');

    if (logText.includes('Can\'t keep up')) {
      recommendations.push('⚡ Reduce view-distance from 10 to 8 in server.properties');
      recommendations.push('🔧 Enable Paper/Spigot optimizations');
    }

    if (logText.includes('Skipping Entity') || logText.includes('Too many entities')) {
      recommendations.push('🐔 Too many entities detected - clear entities with /kill @e[type=!player]');
      recommendations.push('📊 Consider using a mob limiter plugin');
    }

    if (logText.match(/Memory.*?%/) && parseInt(logText.match(/(\d+)%/)?.[1] || '0') > 90) {
      recommendations.push('💾 Memory usage above 90% - increase max RAM');
      recommendations.push('🗑️ Run /gc to force garbage collection');
    }

    if (recommendations.length === 0) {
      recommendations.push('✅ No major performance issues detected!');
    }

    return recommendations;
  }
}
