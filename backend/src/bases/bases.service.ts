import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlayerBase } from '../entities/player-base.entity';

export interface CreateBaseDto {
  name: string;
  description?: string;
  playerId: string;
  serverId: string;
  world: string;
  x: number;
  y: number;
  z: number;
  screenshotUrl?: string;
  isPublic: boolean;
}

@Injectable()
export class BasesService {
  constructor(
    @InjectRepository(PlayerBase)
    private baseRepository: Repository<PlayerBase>,
  ) {}

  async createBase(data: CreateBaseDto): Promise<PlayerBase> {
    console.log('🏡 [BASES] Creating new player base:', data.name);
    
    const base = this.baseRepository.create(data);
    await this.baseRepository.save(base);
    
    console.log('✅ [BASES] Base created:', base.id);
    return base;
  }

  async getAllBases(serverId: string): Promise<PlayerBase[]> {
    return this.baseRepository.find({
      where: { serverId, isPublic: true },
      relations: ['player'],
      order: { createdAt: 'DESC' }
    });
  }

  async getPlayerBases(playerId: string): Promise<PlayerBase[]> {
    return this.baseRepository.find({
      where: { playerId },
      relations: ['player', 'server'],
      order: { createdAt: 'DESC' }
    });
  }

  async updateBase(id: string, updates: Partial<CreateBaseDto>): Promise<PlayerBase> {
    await this.baseRepository.update(id, updates);
    const updated = await this.baseRepository.findOne({ where: { id }, relations: ['player'] });
    
    if (!updated) {
      throw new Error('Base not found');
    }
    
    return updated;
  }

  async deleteBase(id: string): Promise<void> {
    await this.baseRepository.delete(id);
  }

  /**
   * Get bases near coordinates (for map clustering)
   */
  async getBasesNearby(serverId: string, x: number, z: number, radius: number): Promise<PlayerBase[]> {
    const bases = await this.getAllBases(serverId);
    
    return bases.filter(base => {
      const distance = Math.sqrt(
        Math.pow(Number(base.x) - x, 2) + 
        Math.pow(Number(base.z) - z, 2)
      );
      return distance <= radius;
    });
  }
}
