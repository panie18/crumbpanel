import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Server } from './server.entity';

@Entity('backups')
export class Backup {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  fileName: string;

  @Column()
  filePath: string;

  @Column('bigint')
  size: number;

  @Column({ default: 'MANUAL' })
  type: string; // 'MANUAL' or 'AUTO'

  @Column()
  serverId: string;

  @ManyToOne(() => Server, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'serverId' })
  server: Server;

  @CreateDateColumn()
  createdAt: Date;
}
