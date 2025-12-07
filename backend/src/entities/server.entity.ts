import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Player } from './player.entity';

@Entity('servers')
export class Server {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ default: 'java' })
  serverType: 'java' | 'bedrock';

  @Column()
  version: string;

  @Column({ type: 'int', default: 2 })
  maxRam: number;

  @Column({ type: 'int', default: 25565 })
  port: number;

  @Column({ default: 'STOPPED' })
  status: 'STOPPED' | 'STARTING' | 'RUNNING' | 'STOPPING';

  @Column({ nullable: true })
  serverPath: string;

  @Column({ nullable: true })
  host: string;

  @Column({ type: 'int', nullable: true })
  rconPort: number;

  @Column({ nullable: true })
  rconPassword: string;

  @OneToMany(() => Player, (player) => player.serverId)
  players: Player[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
