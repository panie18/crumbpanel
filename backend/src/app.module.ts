import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { ServersModule } from './servers/servers.module';
import { PluginsModule } from './plugins/plugins.module';
import { BackupsModule } from './backups/backups.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET || 'fallback-secret',
      signOptions: { expiresIn: '1h' },
    }),
    DatabaseModule,
    AuthModule,
    ServersModule,
    PluginsModule,
    BackupsModule,
  ],
})
export class AppModule {}
