import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as os from 'os';

const execAsync = promisify(exec);

@Injectable()
export class MetricsService {
  constructor(private prisma: PrismaService) {
    // Start collecting metrics every 30 seconds
    setInterval(() => this.collectMetrics(), 30000);
  }

  async collectMetrics() {
    const servers = await this.prisma.server.findMany({
      where: { status: 'RUNNING' },
    });

    for (const server of servers) {
      try {
        const metrics = await this.getServerMetrics(server.id);
        
        await this.prisma.metric.create({
          data: {
            serverId: server.id,
            cpuUsage: metrics.cpu,
            ramUsage: metrics.ram,
            tps: metrics.tps,
            players: metrics.players,
          },
        });

        // Keep only last 1000 metrics per server
        const count = await this.prisma.metric.count({
          where: { serverId: server.id },
        });

        if (count > 1000) {
          const toDelete = await this.prisma.metric.findMany({
            where: { serverId: server.id },
            orderBy: { timestamp: 'asc' },
            take: count - 1000,
          });

          await this.prisma.metric.deleteMany({
            where: {
              id: { in: toDelete.map(m => m.id) },
            },
          });
        }
      } catch (error) {
        console.error(`Error collecting metrics for server ${server.id}:`, error.message);
      }
    }
  }

  async getServerMetrics(serverId: string) {
    const server = await this.prisma.server.findUnique({
      where: { id: serverId },
    });

    const cpu = await this.getCpuUsage(serverId);
    const ram = await this.getRamUsage(serverId);
    const tps = 20.0; // Would need actual TPS from server
    const players = await this.getPlayerCount(serverId);

    return { cpu, ram, tps, players };
  }

  async getMetricsHistory(serverId: string, limit: number = 50) {
    return this.prisma.metric.findMany({
      where: { serverId },
      orderBy: { timestamp: 'desc' },
      take: limit,
    });
  }

  async getSystemMetrics() {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const cpus = os.cpus();

    return {
      cpu: {
        cores: cpus.length,
        model: cpus[0].model,
        usage: await this.getSystemCpuUsage(),
      },
      memory: {
        total: totalMem,
        used: usedMem,
        free: freeMem,
        percentage: (usedMem / totalMem) * 100,
      },
      uptime: os.uptime(),
      platform: os.platform(),
    };
  }

  private async getCpuUsage(serverId: string): Promise<number> {
    try {
      const { stdout } = await execAsync(
        `ps aux | grep "mc_${serverId}" | grep -v grep | awk '{print $3}'`
      );
      return parseFloat(stdout.trim()) || 0;
    } catch {
      return 0;
    }
  }

  private async getRamUsage(serverId: string): Promise<number> {
    try {
      const { stdout } = await execAsync(
        `ps aux | grep "mc_${serverId}" | grep -v grep | awk '{print $4}'`
      );
      return parseFloat(stdout.trim()) || 0;
    } catch {
      return 0;
    }
  }

  private async getPlayerCount(serverId: string): Promise<number> {
    const players = await this.prisma.player.count({
      where: { serverId, isOnline: true },
    });
    return players;
  }

  private async getSystemCpuUsage(): Promise<number> {
    const cpus = os.cpus();
    let totalIdle = 0;
    let totalTick = 0;

    for (const cpu of cpus) {
      for (const type in cpu.times) {
        totalTick += cpu.times[type];
      }
      totalIdle += cpu.times.idle;
    }

    return 100 - (100 * totalIdle) / totalTick;
  }
}
