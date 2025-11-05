import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import { User } from '../entities/user.entity';
import { TotpService } from './totp.service';
import { Fido2Service } from './fido2.service';

@Module({
  imports: [
    PassportModule,
    TypeOrmModule.forFeature([User]),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, TotpService, Fido2Service],
  exports: [AuthService, TotpService, Fido2Service],
})
export class AuthModule {}
