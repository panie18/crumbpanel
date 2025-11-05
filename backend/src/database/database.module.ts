import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../entities/user.entity';
import { Server } from '../entities/server.entity';
import { Player } from '../entities/player.entity';
import { Backup } from '../entities/backup.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: './data/crumbpanel.db',
      entities: [User, Server, Player, Backup],
      synchronize: true,
      logging: ['error', 'warn', 'info', 'log'],
      logger: 'advanced-console',
    }),
  ],
})
export class DatabaseModule {}
