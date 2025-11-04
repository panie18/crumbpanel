import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Server } from '../entities/server.entity';

@Injectable()
export class ServersService {
  constructor(
    @InjectRepository(Server)
    private serverRepository: Repository<Server>,
  ) {}

  async getAll() {
    return this.serverRepository.find({
      relations: ['players', 'backups'],
    });
  }

  async create(data: any) {
    return this.serverRepository.save({
      name: data.name,
      port: data.port,
      rconPort: data.rconPort,
      rconPassword: data.rconPassword,
      version: data.version,
      maxRam: data.maxRam,
    });
  }

  async findById(id: string) {
    return this.serverRepository.findOne({
      where: { id },
      relations: ['players', 'backups'],
    });
  }
}
