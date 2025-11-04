import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Server } from './server.entity';

@Entity('backups')
export class Backup {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  serverId: string;

  @ManyToOne(() => Server, server => server.backups)
  @JoinColumn({ name: 'serverId' })
  server: Server;

  @Column()
  filename: string;

  @Column('bigint')
  size: number;

  @CreateDateColumn()
  createdAt: Date;
}
