import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

export interface ServerPerformance {
  serverId: string;
  timestamp: number;
  tps: number;
  memoryUsed: number;
  memoryMax: number;
  memoryPercent: number;
  players: number;
  chunks: number;
  entities: number;
}

@Injectable()
export class PerformanceMonitorService {
  private performanceData = new Map<string, ServerPerformance>();
  
  constructor(private eventEmitter: EventEmitter2) {}

  /**
   * Parse TPS from server output
   */
  parseTPS(serverId: string, logLine: string): void {
    // Match patterns like: "TPS from last 1m, 5m, 15m: 20.0, 20.0, 20.0"
    const tpsMatch = logLine.match(/TPS.*?(\d+\.\d+)/);
    if (tpsMatch) {
      const tps = parseFloat(tpsMatch[1]);
      this.updatePerformance(serverId, { tps });
    }
  }

  /**
   * Parse memory usage from server logs
   */
  parseMemory(serverId: string, logLine: string): void {
    // Match: "Memory: 2048MB/4096MB (50%)"
    const memMatch = logLine.match(/Memory:.*?(\d+)MB\/(\d+)MB.*?(\d+)%/);
    if (memMatch) {
      this.updatePerformance(serverId, {
        memoryUsed: parseInt(memMatch[1]),
        memoryMax: parseInt(memMatch[2]),
        memoryPercent: parseInt(memMatch[3])
      });
    }
  }

  /**
   * Parse player count
   */
  parsePlayers(serverId: string, logLine: string): void {
    // Match: "There are 5 of a max of 20 players online"
    const playerMatch = logLine.match(/There are (\d+) of a max of (\d+) players/);
    if (playerMatch) {
      this.updatePerformance(serverId, {
        players: parseInt(playerMatch[1])
      });
    }
  }

  private updatePerformance(serverId: string, data: Partial<ServerPerformance>): void {
    const current = this.performanceData.get(serverId) || {
      serverId,
      timestamp: Date.now(),
      tps: 20,
      memoryUsed: 0,
      memoryMax: 0,
      memoryPercent: 0,
      players: 0,
      chunks: 0,
      entities: 0
    };

    const updated = {
      ...current,
      ...data,
      timestamp: Date.now()
    };

    this.performanceData.set(serverId, updated);
    
    // Emit event for WebSocket broadcast
    this.eventEmitter.emit('server.performance', updated);
  }

  getPerformance(serverId: string): ServerPerformance | null {
    return this.performanceData.get(serverId) || null;
  }

  getAllPerformance(): ServerPerformance[] {
    return Array.from(this.performanceData.values());
  }
}
