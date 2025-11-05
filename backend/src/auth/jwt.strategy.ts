import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'fallback-secret',
    });
  }

  async validate(payload: any) {
    console.log('🔐 [JWT] Validating token payload:', payload);
    
    try {
      const user = await this.userRepository.findOne({
        where: { id: payload.sub },
      });

      if (!user) {
        console.error('❌ [JWT] User not found:', payload.sub);
        throw new UnauthorizedException('User not found');
      }

      console.log('✅ [JWT] User validated:', user.email);
      
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      };
    } catch (error) {
      console.error('❌ [JWT] Validation error:', error);
      throw new UnauthorizedException('Invalid token');
    }
  }
}
