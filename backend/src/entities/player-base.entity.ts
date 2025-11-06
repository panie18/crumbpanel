import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('player_bases')
export class PlayerBase {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  serverId: string;

  @Column()
  playerName: string;

  @Column()
  playerUuid: string;

  @Column()
  name: string;

  @Column('float')
  x: number;

  @Column('float')
  y: number;

  @Column('float')
  z: number;

  @Column({ default: 'overworld' })
  dimension: string;

  @Column({ nullable: true })
  description: string;

  @CreateDateColumn()
  createdAt: Date;
}
