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
