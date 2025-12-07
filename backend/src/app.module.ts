import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { AuthModule } from './auth/auth.module';
import { ServersModule } from './servers/servers.module';
import { Server } from './entities/server.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: './data/crumbpanel.db',
      entities: [Server],
      synchronize: true,
      logging: false,
    }),
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET || 'crumbpanel-secret-key-change-in-production',
      signOptions: { expiresIn: '7d' },
    }),
    AuthModule,
    ServersModule,
  ],
})
export class AppModule {}
