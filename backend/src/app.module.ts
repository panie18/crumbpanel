import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { ServersModule } from './servers/servers.module';
import { BackupsModule } from './backups/backups.module';
import { User } from './entities/user.entity';
import { Server } from './entities/server.entity';
import { Backup } from './entities/backup.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: './data/crumbpanel.db',
      entities: [User, Server, Backup],
      synchronize: true,
      logging: false,
    }),
    AuthModule,
    ServersModule,
    BackupsModule,
  ],
})
export class AppModule {}
