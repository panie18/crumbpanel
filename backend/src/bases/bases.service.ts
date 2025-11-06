import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlayerBase } from '../entities/player-base.entity';

@Injectable()
export class BasesService {
  constructor(
    @InjectRepository(PlayerBase)
    private baseRepository: Repository<PlayerBase>,
  ) {}

  async getAllBases(serverId: string): Promise<PlayerBase[]> {
    return this.baseRepository.find({ where: { serverId } });
  }

  async createBase(data: Partial<PlayerBase>): Promise<PlayerBase> {
    const base = this.baseRepository.create(data);
    return this.baseRepository.save(base);
  }

  async deleteBase(id: string): Promise<void> {
    await this.baseRepository.delete(id);
  }
}
