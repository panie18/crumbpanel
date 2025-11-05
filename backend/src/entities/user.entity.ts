import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ nullable: true })
  name: string;

  @Column({ nullable: true })
  picture: string;

  @Column({ default: 'USER' })
  role: string;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ nullable: true })
  totpSecret: string;

  @Column({ default: false })
  totpEnabled: boolean;
}
