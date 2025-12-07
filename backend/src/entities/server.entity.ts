import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

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

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
