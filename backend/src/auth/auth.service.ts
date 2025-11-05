import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { User } from '../entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async getSetupStatus() {
    const userCount = await this.userRepository.count();
    return {
      isSetupComplete: userCount > 0,
      needsSetup: userCount === 0,
    };
  }

  async initialSetup(data: { username: string; email: string; password: string }) {
    try {
      console.log('Starting setup for:', data.email);
      
      const userCount = await this.userRepository.count();
      console.log('Current user count:', userCount);
      
      if (userCount > 0) {
        throw new Error('Setup already completed');
      }

      console.log('Creating user...');
      const user = await this.userRepository.save({
        email: data.email,
        name: data.username,
        password: data.password, // In production, hash this!
        role: 'ADMIN',
      });

      console.log('User created, generating token...');
      const payload = { sub: user.id, email: user.email, role: user.role };
      const accessToken = this.jwtService.sign(payload);

      console.log('Setup completed successfully');
      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        accessToken,
      };
    } catch (error) {
      console.error('Setup error:', error);
      throw new Error(`Setup failed: ${error.message}`);
    }
  }

  async login(email: string, password: string) {
    const user = await this.userRepository.findOne({
      where: { email },
    });

    if (!user || user.password !== password) {
      throw new Error('Invalid credentials');
    }

    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = this.jwtService.sign(payload);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      accessToken,
    };
  }
}
