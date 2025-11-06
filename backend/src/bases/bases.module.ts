import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BasesController } from './bases.controller';
import { BasesService } from './bases.service';
import { PlayerBase } from '../entities/player-base.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PlayerBase])],
  controllers: [BasesController],
  providers: [BasesService],
  exports: [BasesService],
})
export class BasesModule {}
