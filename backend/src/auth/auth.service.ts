import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from '../entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectDataSource()
    private dataSource: DataSource,
    private jwtService: JwtService,
  ) {}

  async getSetupStatus() {
    console.log('📊 [AUTH] Checking setup status...');
    
    try {
      const userCount = await this.userRepository.count();
      console.log('📊 [AUTH] User count in database:', userCount);

      // WICHTIG: Wenn User existieren, kein Setup nötig!
      const isSetupComplete = userCount > 0;
      const needsSetup = userCount === 0;

      const result = {
        isSetupComplete,
        needsSetup,
        userCount
      };

      console.log('📊 [AUTH] Setup status result:', result);
      return result;

    } catch (error) {
      console.error('❌ [AUTH] Setup status check failed:', error);
      // Bei Fehler: Setup erlauben
      return {
        isSetupComplete: false,
        needsSetup: true,
        userCount: 0
      };
    }
  }

  async initialSetup(setupData: {
    username: string;
    email: string;
    password: string;
  }) {
    console.log('🚀 [AUTH] Starting initial setup...');
    console.log('🚀 [AUTH] Setup data:', { username: setupData.username, email: setupData.email });
    
    try {
      const userCount = await this.userRepository.count();
      console.log('🔍 [AUTH] Current user count:', userCount);

      if (userCount > 0) {
        console.log('❌ [AUTH] Setup already completed');
        const existingUser = await this.userRepository.findOne({ 
          where: {}, 
          order: { createdAt: 'ASC' } 
        });
        
        if (existingUser) {
          const token = this.jwtService.sign({
            sub: existingUser.id,
            email: existingUser.email,
          });
          
          return {
            message: 'Setup was already completed, logging you in',
            user: {
              id: existingUser.id,
              username: existingUser.username,
              email: existingUser.email,
              role: existingUser.role,
            },
            token,
          };
        }
      }

      // Hash password properly with bcrypt
      console.log('🔐 [AUTH] Hashing password with bcrypt...');
      const hashedPassword = await bcrypt.hash(setupData.password, 10);
      console.log('✅ [AUTH] Password hashed successfully');

      const adminUser = this.userRepository.create({
        username: setupData.username,
        email: setupData.email,
        password: hashedPassword,
        role: 'admin',
        twoFactorEnabled: false,
      });

      const savedUser = await this.userRepository.save(adminUser);

      console.log('✅ [AUTH] Admin user created with ID:', savedUser.id);

      const token = this.jwtService.sign({
        sub: savedUser.id,
        email: savedUser.email,
        username: savedUser.username,
        role: savedUser.role
      });

      return {
        success: true,
        message: 'Setup completed successfully',
        user: {
          id: savedUser.id,
          username: savedUser.username,
          email: savedUser.email,
          role: savedUser.role,
        },
        token,
      };
    } catch (error) {
      console.error('💥 [AUTH] Setup failed with error:', error);
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
      console.log(`🔐 [AUTH] Comparing password...`);
      
      // Compare password with bcrypt
      const isPasswordValid = await bcrypt.compare(password, user.password);
      
      if (!isPasswordValid) {
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
