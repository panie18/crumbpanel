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
    const userCount = await this.userRepository.count();
    
    if (userCount > 0) {
      throw new Error('Setup already completed');
    }

    // Simple password storage for now (you should hash this in production)
    const user = await this.userRepository.save({
      email: data.email,
      name: data.username,
      password: data.password,
      role: 'ADMIN',
    });

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
