import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { ServersModule } from './servers/servers.module';
import { PluginsModule } from './plugins/plugins.module';

@Module({
  imports: [
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET || 'fallback-secret',
      signOptions: { expiresIn: '7d' },
    }),
    DatabaseModule,
    AuthModule,
    ServersModule,
    PluginsModule,
    // TODO: Add these when files are created:
    // BasesModule,
    // LeaderboardsModule,
    // AutomationModule,
  ],
})
export class AppModule {}
