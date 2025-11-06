import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Player } from '../entities/player.entity';

@Injectable()
export class LeaderboardsService {
  constructor(
    @InjectRepository(Player)
    private playerRepository: Repository<Player>,
  ) {}

  async getTopPlayers(serverId: string, metric: 'playtime' | 'kills' | 'deaths' | 'joins', limit: number = 10) {
    // Mock data - will be replaced with real stats later
    const mockData = [
      { rank: 1, username: 'Builder_Pro', value: 245, uuid: 'uuid-1' },
      { rank: 2, username: 'Miner_King', value: 189, uuid: 'uuid-2' },
      { rank: 3, username: 'PvP_Master', value: 156, uuid: 'uuid-3' },
      { rank: 4, username: 'Farmer_Jack', value: 134, uuid: 'uuid-4' },
      { rank: 5, username: 'Explorer_Sam', value: 98, uuid: 'uuid-5' },
    ];

    return {
      metric,
      data: mockData.slice(0, limit),
      lastUpdated: new Date()
    };
  }
}
