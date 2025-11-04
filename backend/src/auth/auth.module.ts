import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { Auth0Strategy } from './auth0.strategy';
import { JwtStrategy } from './jwt.strategy';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    PassportModule,
    PrismaModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, Auth0Strategy, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
