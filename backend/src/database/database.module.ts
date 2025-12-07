import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Server } from '../entities/server.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: './data/crumbpanel.db',
      entities: [Server],
      synchronize: true, // Auto-create tables
      logging: false,
    }),
    TypeOrmModule.forFeature([Server]),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
