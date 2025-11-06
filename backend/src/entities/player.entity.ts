import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('players')
export class Player {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  uuid: string;

  @Column()
  username: string;

  @Column()
  serverId: string;

  @Column({ default: 0 })
  playtime: number;

  @Column({ default: 0 })
  kills: number;

  @Column({ default: 0 })
  deaths: number;

  @Column({ default: 0 })
  joins: number;

  @Column({ nullable: true })
  lastSeen: Date;

  @CreateDateColumn()
  firstJoin: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
