import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import { User } from '../entities/user.entity';
import { TotpService } from './totp.service';

@Module({
  imports: [
    PassportModule,
    TypeOrmModule.forFeature([User]),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, TotpService],
  exports: [AuthService, TotpService],
})
export class AuthModule {}
