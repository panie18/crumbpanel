import { Module } from '@nestjs/common';
import { CloudBackupController } from './cloud-backup.controller';
import { CloudBackupService } from './cloud-backup.service';
import { WebDavService } from './webdav.service';

@Module({
  controllers: [CloudBackupController],
  providers: [CloudBackupService, WebDavService],
  exports: [CloudBackupService],
})
export class CloudBackupModule {}
