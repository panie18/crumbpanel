import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  username: string;

  @Column({ nullable: true })
  name: string;

  @Column()
  password: string;

  @Column({ default: 'USER' })
  role: string;

  @Column({ nullable: true })
  totpSecret: string;

  @Column({ default: false })
  totpEnabled: boolean;

  @Column({ nullable: true })
  picture: string;

  @Column({ nullable: true })
  profilePicture: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
