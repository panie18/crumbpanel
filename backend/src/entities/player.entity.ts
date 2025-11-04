import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Server } from './server.entity';

@Entity('players')
export class Player {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  uuid: string;

  @Column()
  serverId: string;

  @ManyToOne(() => Server, server => server.players)
  @JoinColumn({ name: 'serverId' })
  server: Server;

  @Column({ default: false })
  isOnline: boolean;

  @CreateDateColumn()
  lastSeen: Date;

  @CreateDateColumn()
  createdAt: Date;
}
