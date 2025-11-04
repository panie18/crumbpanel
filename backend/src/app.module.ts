import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ServersModule } from './servers/servers.module';
import { PlayersModule } from './players/players.module';
import { MetricsModule } from './metrics/metrics.module';
import { FilesModule } from './files/files.module';
import { WebSocketModule } from './websocket/websocket.module';
import { AuditModule } from './audit/audit.module';
import { CloudBackupModule } from './cloud-backup/cloud-backup.module';
import { BackupsModule } from './backups/backups.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    JwtModule.register({
      global: true,
    }),
    PrismaModule,
    AuthModule,
    ServersModule,
    PlayersModule,
    MetricsModule,
    FilesModule,
    WebSocketModule,
    AuditModule,
    CloudBackupModule,
    BackupsModule,
  ],
})
export class AppModule {}
