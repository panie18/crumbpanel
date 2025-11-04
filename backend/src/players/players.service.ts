import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RconService } from '../servers/rcon.service';

@Injectable()
export class PlayersService {
  constructor(
    private prisma: PrismaService,
    private rconService: RconService,
  ) {}

  async getOnlinePlayers(serverId: string) {
    const server = await this.prisma.server.findUnique({
      where: { id: serverId },
    });

    if (!server || server.status !== 'RUNNING') {
      return [];
    }

    try {
      const response = await this.rconService.sendCommand(server, 'list');
      const players = this.parsePlayerList(response);

      // Update database
      for (const playerName of players) {
        const existingPlayer = await this.prisma.player.findFirst({
          where: {
            name: playerName,
            serverId: serverId,
          },
        });

        if (existingPlayer) {
          await this.prisma.player.update({
            where: { id: existingPlayer.id },
            update: {
              isOnline: true,
              lastSeen: new Date(),
            },
          });
        } else {
          await this.prisma.player.create({
            data: {
              name: playerName,
              uuid: this.generateUUID(),
              serverId,
              isOnline: true,
            },
          });
        }
      }

      // Mark offline players
      await this.prisma.player.updateMany({
        where: {
          serverId,
          name: { notIn: players },
        },
        data: { isOnline: false },
      });

      return this.prisma.player.findMany({
        where: { serverId, isOnline: true },
      });
    } catch (error) {
      return [];
    }
  }

  async kickPlayer(serverId: string, playerName: string, reason?: string) {
    const server = await this.prisma.server.findUnique({
      where: { id: serverId },
    });

    const command = reason
      ? `kick ${playerName} ${reason}`
      : `kick ${playerName}`;

    const response = await this.rconService.sendCommand(server, command);
    return { message: response };
  }

  async banPlayer(serverId: string, playerName: string, reason?: string) {
    const server = await this.prisma.server.findUnique({
      where: { id: serverId },
    });

    const command = reason
      ? `ban ${playerName} ${reason}`
      : `ban ${playerName}`;

    const response = await this.rconService.sendCommand(server, command);
    return { message: response };
  }

  async pardonPlayer(serverId: string, playerName: string) {
    const server = await this.prisma.server.findUnique({
      where: { id: serverId },
    });

    const response = await this.rconService.sendCommand(server, `pardon ${playerName}`);
    return { message: response };
  }

  async whitelistAdd(serverId: string, playerName: string) {
    const server = await this.prisma.server.findUnique({
      where: { id: serverId },
    });

    const response = await this.rconService.sendCommand(server, `whitelist add ${playerName}`);
    return { message: response };
  }

  async whitelistRemove(serverId: string, playerName: string) {
    const server = await this.prisma.server.findUnique({
      where: { id: serverId },
    });

    const response = await this.rconService.sendCommand(server, `whitelist remove ${playerName}`);
    return { message: response };
  }

  async getAllPlayers(serverId: string) {
    return this.prisma.player.findMany({
      where: { serverId },
      orderBy: { lastSeen: 'desc' },
    });
  }

  private parsePlayerList(response: string): string[] {
    // Example response: "There are 3/20 players online: Player1, Player2, Player3"
    const match = response.match(/:\s*(.+)$/);
    if (!match) return [];
    
    return match[1]
      .split(',')
      .map(p => p.trim())
      .filter(p => p.length > 0);
  }

  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
}
