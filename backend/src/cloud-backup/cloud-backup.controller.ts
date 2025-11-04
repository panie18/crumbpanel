import { Controller, Post, Get, Delete, Param, Query, UseGuards } from '@nestjs/common';
import { CloudBackupService } from './cloud-backup.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('cloud-backups')
@UseGuards(JwtAuthGuard)
export class CloudBackupController {
  constructor(private cloudBackupService: CloudBackupService) {}

  @Post('create/:serverId')
  createBackup(
    @Param('serverId') serverId: string,
    @Query('cloud') uploadToCloud: string,
  ) {
    return this.cloudBackupService.createBackup(serverId, uploadToCloud === 'true');
  }

  @Post('restore/:backupId')
  restoreBackup(
    @Param('backupId') backupId: string,
    @Query('cloud') fromCloud: string,
  ) {
    return this.cloudBackupService.restoreBackup(backupId, fromCloud === 'true');
  }

  @Delete(':backupId')
  deleteBackup(
    @Param('backupId') backupId: string,
    @Query('cloud') deleteFromCloud: string,
  ) {
    return this.cloudBackupService.deleteBackup(backupId, deleteFromCloud === 'true');
  }

  @Get('list')
  listCloudBackups() {
    return this.cloudBackupService.listCloudBackups();
  }

  @Post('sync/:serverId')
  syncWithCloud(@Param('serverId') serverId: string) {
    return this.cloudBackupService.syncWithCloud(serverId);
  }
}
