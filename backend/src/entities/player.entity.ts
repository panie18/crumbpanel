import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Server } from './server.entity';

@Entity('players')
export class Player {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  username: string;

  @Column()
  uuid: string;

  @Column({ nullable: true })
  lastSeen: Date;

  @Column({ default: false })
  isOnline: boolean;

  @Column()
  serverId: string;

  @ManyToOne(() => Server, server => server.players, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'serverId' })
  server: Server;

  @CreateDateColumn()
  createdAt: Date;
}
