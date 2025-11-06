import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { ServersModule } from './servers/servers.module';
import { PluginsModule } from './plugins/plugins.module';
import { BasesModule } from './bases/bases.module';
import { LeaderboardsModule } from './leaderboards/leaderboards.module';
import { AutomationModule } from './automation/automation.module';

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
    BasesModule,
    LeaderboardsModule,
    AutomationModule,
  ],
})
export class AppModule {}
