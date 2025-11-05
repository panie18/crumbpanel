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
    try {
      console.log('📊 [AUTH] Checking setup status...');
      console.log('📊 [AUTH] Database connection:', !!this.userRepository);
      
      const userCount = await this.userRepository.count();
      console.log(`📊 [AUTH] User count in database: ${userCount}`);
      
      const result = {
        isSetupComplete: userCount > 0,
        needsSetup: userCount === 0,
        userCount,
      };
      
      console.log('📊 [AUTH] Setup status result:', result);
      return result;
    } catch (error) {
      console.error('❌ [AUTH] Setup status check failed:', error);
      console.error('❌ [AUTH] Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
      });
      
      return {
        isSetupComplete: false,
        needsSetup: true,
        userCount: 0,
        error: error.message,
      };
    }
  }

  async initialSetup(data: { username: string; email: string; password: string }) {
    try {
      console.log('🚀 [AUTH] Starting initial setup...');
      console.log('🚀 [AUTH] Setup data:', { username: data.username, email: data.email });
      
      console.log('🔍 [AUTH] Checking current user count...');
      const userCount = await this.userRepository.count();
      console.log(`🔍 [AUTH] Current user count: ${userCount}`);
      
      if (userCount > 0) {
        console.log('❌ [AUTH] Setup already completed');
        throw new Error('Setup already completed');
      }

      console.log('💾 [AUTH] Creating user in database...');
      const user = await this.userRepository.save({
        email: data.email,
        name: data.username,
        password: data.password,
        role: 'ADMIN',
      });
      console.log('✅ [AUTH] User created with ID:', user.id);

      console.log('🎫 [AUTH] Generating JWT token...');
      const payload = { sub: user.id, email: user.email, role: user.role };
      const accessToken = this.jwtService.sign(payload);
      console.log('✅ [AUTH] JWT token generated');

      console.log('🎉 [AUTH] Setup completed successfully');
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
      console.error('💥 [AUTH] Setup failed with error:', error);
      console.error('💥 [AUTH] Error name:', error.name);
      console.error('💥 [AUTH] Error message:', error.message);
      console.error('💥 [AUTH] Error stack:', error.stack);
      
      if (error.message?.includes('UNIQUE constraint failed')) {
        throw new Error('Email already exists');
      }
      
      throw new Error(`Setup failed: ${error.message}`);
    }
  }

  async login(email: string, password: string) {
    try {
      console.log(`🔐 [AUTH] Login attempt for: ${email}`);
      
      const user = await this.userRepository.findOne({
        where: { email },
      });
      
      if (!user) {
        console.log(`❌ [AUTH] User not found: ${email}`);
        throw new Error('Invalid credentials');
      }
      
      console.log(`🔍 [AUTH] User found: ${user.id}`);
      
      if (user.password !== password) {
        console.log(`❌ [AUTH] Password mismatch for: ${email}`);
        throw new Error('Invalid credentials');
      }
      
      console.log(`✅ [AUTH] Login successful for: ${email}`);
      
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
    } catch (error) {
      console.error(`💥 [AUTH] Login failed for ${email}:`, error);
      throw error;
    }
  }
}
