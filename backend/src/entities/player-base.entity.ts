import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Player } from './player.entity';
import { Server } from './server.entity';

@Entity('player_bases')
export class PlayerBase {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column()
  playerId: string;

  @ManyToOne(() => Player)
  @JoinColumn({ name: 'playerId' })
  player: Player;

  @Column()
  serverId: string;

  @ManyToOne(() => Server)
  @JoinColumn({ name: 'serverId' })
  server: Server;

  @Column()
  world: string; // overworld, nether, end

  @Column('decimal')
  x: number;

  @Column('decimal')
  y: number;

  @Column('decimal')
  z: number;

  @Column({ nullable: true })
  screenshotUrl: string;

  @Column({ default: false })
  isPublic: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
