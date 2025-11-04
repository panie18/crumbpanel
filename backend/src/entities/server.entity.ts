import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Player } from './player.entity';
import { Backup } from './backup.entity';

@Entity('servers')
export class Server {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  port: number;

  @Column()
  rconPort: number;

  @Column()
  rconPassword: string;

  @Column()
  version: string;

  @Column()
  maxRam: number;

  @Column({ default: 'STOPPED' })
  status: string;

  @OneToMany(() => Player, player => player.server)
  players: Player[];

  @OneToMany(() => Backup, backup => backup.server)
  backups: Backup[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
