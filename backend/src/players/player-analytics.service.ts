import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Player } from '../entities/player.entity';

export interface PlayerStats {
  totalPlayers: number;
  onlinePlayers: number;
  newPlayersToday: number;
  averageSessionTime: number;
  topPlayers: {
    username: string;
    playTime: number;
    lastSeen: Date;
  }[];
  joinsByHour: { hour: number; joins: number }[];
}

@Injectable()
export class PlayerAnalyticsService {
  constructor(
    @InjectRepository(Player)
    private playerRepository: Repository<Player>,
  ) {}

  async getAnalytics(serverId: string): Promise<PlayerStats> {
    const players = await this.playerRepository.find({
      where: { serverId },
      order: { lastSeen: 'DESC' }
    });

    const onlinePlayers = players.filter(p => p.isOnline).length;
    
    // Players who joined in last 24 hours
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const newPlayers = players.filter(p => p.createdAt > yesterday).length;

    // Calculate average session time (mock data for now)
    const averageSessionTime = 45; // minutes

    // Top 10 players by play time
    const topPlayers = players
      .slice(0, 10)
      .map(p => ({
        username: p.username,
        playTime: Math.random() * 500, // TODO: Track actual play time
        lastSeen: p.lastSeen || new Date()
      }));

    // Joins by hour (mock data)
    const joinsByHour = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      joins: Math.floor(Math.random() * 10)
    }));

    return {
      totalPlayers: players.length,
      onlinePlayers,
      newPlayersToday: newPlayers,
      averageSessionTime,
      topPlayers,
      joinsByHour
    };
  }

  /**
   * Track player activity
   */
  async trackActivity(serverId: string, username: string, action: 'join' | 'leave') {
    let player = await this.playerRepository.findOne({
      where: { serverId, username }
    });

    if (!player) {
      // Create new player record
      player = this.playerRepository.create({
        username,
        uuid: this.generateUUID(username),
        serverId,
        isOnline: action === 'join',
        lastSeen: new Date()
      });
    } else {
      player.isOnline = action === 'join';
      player.lastSeen = new Date();
    }

    await this.playerRepository.save(player);
  }

  private generateUUID(username: string): string {
    // Generate deterministic UUID from username (for demo)
    return `${username}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
