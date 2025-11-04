import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
      const userCount = await this.userRepository.count();
      console.log('Setup status check - User count:', userCount);
      return {
        isSetupComplete: userCount > 0,
        needsSetup: userCount === 0,
        userCount,
      };
    } catch (error) {
      console.error('Setup status check failed:', error);
      return {
        isSetupComplete: false,
        needsSetup: true,
        userCount: 0,
      };
    }
  }

  async initialSetup(dto: { username: string; email: string; password: string }) {
    try {
      console.log('Starting initial setup...');
      
      // Check database connection
      try {
        await this.prisma.$queryRaw`SELECT 1`;
        console.log('✓ Database connection OK');
      } catch (dbError) {
        console.error('✗ Database connection failed:', dbError);
        throw new Error('Database connection failed');
      }

      const userCount = await this.userRepository.count();
      console.log('Current user count:', userCount);
      
      if (userCount > 0) {
        throw new ConflictException('Setup already completed');
      }

      console.log('Hashing password...');
      const hashedPassword = await bcrypt.hash(dto.password, 12);

      console.log('Creating user in database...');
      const user = await this.userRepository.save({
        email: dto.email,
        password: hashedPassword,
        role: 'ADMIN',
      });

      console.log('✓ User created:', user.id);

      console.log('Generating tokens...');
      const tokens = await this.generateTokens(user.id, user.email, user.role);
      
      console.log('Storing refresh token...');
      await this.storeRefreshToken(user.id, tokens.refreshToken);

      console.log('✓ Setup completed successfully');

      return {
        user,
        ...tokens,
        message: 'Setup completed successfully',
      };
    } catch (error) {
      console.error('Setup failed with error:', error);
      
      if (error instanceof ConflictException) {
        throw error;
      }
      
      // Provide more specific error messages
      if (error.code === 'P2002') {
        throw new ConflictException('Email already exists');
      }
      
      if (error.message?.includes('Database')) {
        throw new Error('Database connection error. Please wait a moment and try again.');
      }
      
      throw new Error(`Setup failed: ${error.message || 'Unknown error'}`);
    }
  }

  async register(dto: RegisterDto) {
    const exists = await this.userRepository.findOne({
      where: { email: dto.email },
    });

    if (exists) {
      throw new ConflictException('User already exists');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 12);

    const user = await this.userRepository.save({
      email: dto.email,
      password: hashedPassword,
      role: 'USER',
    });

    return user;
  }

  async login(dto: LoginDto) {
    console.log('Login attempt for:', dto.email);
    
    const user = await this.userRepository.findOne({
      where: { email: dto.email },
    });

    if (!user) {
      console.log('User not found:', dto.email);
      throw new UnauthorizedException('Invalid credentials');
    }

    console.log('User found, comparing passwords...');
    const valid = await bcrypt.compare(dto.password, user.password);
    
    if (!valid) {
      console.log('Password invalid for:', dto.email);
      throw new UnauthorizedException('Invalid credentials');
    }

    console.log('Login successful for:', dto.email);
    
    const tokens = await this.generateTokens(user.id, user.email, user.role);
    await this.storeRefreshToken(user.id, tokens.refreshToken);

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      ...tokens,
    };
  }

  async refresh(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      });

      const tokenExists = await this.prisma.refreshToken.findUnique({
        where: { token: refreshToken },
      });

      if (!tokenExists || tokenExists.expiresAt < new Date()) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      // Delete old refresh token
      await this.prisma.refreshToken.delete({
        where: { token: refreshToken },
      });

      const tokens = await this.generateTokens(user.id, user.email, user.role);
      await this.storeRefreshToken(user.id, tokens.refreshToken);

      return tokens;
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(refreshToken: string) {
    await this.prisma.refreshToken.deleteMany({
      where: { token: refreshToken },
    });
    return { message: 'Logged out successfully' };
  }

  private async generateTokens(userId: string, email: string, role: string) {
    const payload = { sub: userId, email, role };

    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_SECRET,
      expiresIn: process.env.JWT_EXPIRE || '1h',
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d',
    });

    return { accessToken, refreshToken };
  }

  private async storeRefreshToken(userId: string, token: string) {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.prisma.refreshToken.create({
      data: {
        token,
        userId,
        expiresAt,
      },
    });
  }

  async validateAuth0User(profile: any) {
    const { id, emails, displayName, photos } = profile;
    
    let user = await this.userRepository.findOne({
      where: { auth0Id: id },
    });

    if (!user) {
      user = await this.userRepository.save({
        auth0Id: id,
        email: emails[0].value,
        name: displayName,
        picture: photos[0]?.value,
        role: 'ADMIN',
      });
    }

    return user;
  }

  async login(user: any) {
    const payload = { 
      sub: user.id, 
      email: user.email,
      role: user.role 
    };
    
    return {
      user,
      accessToken: this.jwtService.sign(payload),
    };
  }
}
