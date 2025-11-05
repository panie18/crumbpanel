import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('servers')
export class Server {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  version: string;

  @Column({ default: 'java' })
  serverType: string; // 'java' or 'bedrock'

  @Column()
  port: number;

  @Column({ nullable: true })
  rconPort: number;

  @Column({ nullable: true })
  rconPassword: string;

  @Column()
  maxRam: number;

  @Column({ default: 20 })
  maxPlayers: number;

  @Column({ default: 'STOPPED' })
  status: string; // 'STOPPED', 'STARTING', 'RUNNING', 'STOPPING', 'ERROR', 'INSTALLING'

  @Column({ nullable: true })
  serverPath: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
