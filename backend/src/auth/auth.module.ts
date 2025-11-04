import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { Auth0Strategy } from './auth0.strategy';
import { JwtStrategy } from './jwt.strategy';
import { User } from '../entities/user.entity';

@Module({
  imports: [
    PassportModule,
    TypeOrmModule.forFeature([User]),
  ],
  controllers: [AuthController],
  providers: [AuthService, Auth0Strategy, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
