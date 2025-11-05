import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Player } from './player.entity';
import { Backup } from './backup.entity';

@Entity('minecraft_servers')
export class Server {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  version: string;

  @Column({ default: 'vanilla' })
  serverType: string; // 'vanilla', 'paper', 'fabric'

  @Column()
  port: number;

  @Column()
  maxRam: number;

  @Column({ default: 20 })
  maxPlayers: number;

  @Column({ default: 'STOPPED' })
  status: string; // 'STOPPED', 'STARTING', 'RUNNING', 'STOPPING', 'ERROR', 'INSTALLING'

  @Column()
  serverPath: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Player, player => player.server)
  players: Player[];

  @OneToMany(() => Backup, backup => backup.server)
  backups: Backup[];
}
