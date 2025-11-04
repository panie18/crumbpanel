import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WebDavService } from './webdav.service';
import * as fs from 'fs/promises';
import * as path from 'path';
import archiver from 'archiver';
import { createWriteStream, createReadStream } from 'fs';

@Injectable()
export class CloudBackupService {
  constructor(
    private prisma: PrismaService,
    private webdav: WebDavService,
  ) {}

  async createBackup(serverId: string, uploadToCloud: boolean = false) {
    const server = await this.prisma.server.findUnique({
      where: { id: serverId },
    });

    if (!server) {
      throw new Error('Server not found');
    }

    const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
    const filename = `${server.name}_${timestamp}.tar.gz`;
    const backupPath = path.join('/app/backups', filename);

    // Ensure backup directory exists
    await fs.mkdir('/app/backups', { recursive: true });

    // Create archive
    await this.createArchive(server.path, backupPath);

    // Get file size
    const stats = await fs.stat(backupPath);

    // Save to database
    const backup = await this.prisma.backup.create({
      data: {
        serverId,
        filename,
        path: backupPath,
        size: BigInt(stats.size),
      },
    });

    // Upload to cloud if requested
    if (uploadToCloud) {
      try {
        await this.webdav.uploadFile(backupPath, filename);
        console.log(`✓ Backup uploaded to cloud: ${filename}`);
      } catch (error) {
        console.error('Cloud upload failed:', error.message);
      }
    }

    return backup;
  }

  async restoreBackup(backupId: string, fromCloud: boolean = false) {
    const backup = await this.prisma.backup.findUnique({
      where: { id: backupId },
      include: { server: true },
    });

    if (!backup) {
      throw new Error('Backup not found');
    }

    let backupPath = backup.path;

    // Download from cloud if needed
    if (fromCloud) {
      backupPath = path.join('/app/backups', 'temp_' + backup.filename);
      await this.webdav.downloadFile(backup.filename, backupPath);
    }

    // Stop server before restore
    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execAsync = promisify(exec);

    try {
      await execAsync(`screen -S mc_${backup.serverId} -X quit`);
    } catch (error) {
      // Server might not be running
    }

    // Clear server directory
    await fs.rm(backup.server.path, { recursive: true, force: true });
    await fs.mkdir(backup.server.path, { recursive: true });

    // Extract backup
    await execAsync(`tar -xzf ${backupPath} -C ${backup.server.path}`);

    // Update server status
    await this.prisma.server.update({
      where: { id: backup.serverId },
      data: { status: 'STOPPED' },
    });

    // Clean up temp file if downloaded from cloud
    if (fromCloud) {
      await fs.unlink(backupPath);
    }

    return { message: 'Backup restored successfully' };
  }

  async deleteBackup(backupId: string, deleteFromCloud: boolean = false) {
    const backup = await this.prisma.backup.findUnique({
      where: { id: backupId },
    });

    if (!backup) {
      throw new Error('Backup not found');
    }

    // Delete local file
    try {
      await fs.unlink(backup.path);
    } catch (error) {
      console.error('Error deleting local backup:', error);
    }

    // Delete from cloud
    if (deleteFromCloud) {
      try {
        await this.webdav.deleteFile(backup.filename);
      } catch (error) {
        console.error('Error deleting cloud backup:', error);
      }
    }

    // Delete from database
    await this.prisma.backup.delete({
      where: { id: backupId },
    });

    return { message: 'Backup deleted successfully' };
  }

  async listCloudBackups() {
    return this.webdav.listFiles();
  }

  async syncWithCloud(serverId: string) {
    const cloudFiles = await this.webdav.listFiles();
    const server = await this.prisma.server.findUnique({
      where: { id: serverId },
    });

    const synced = [];

    for (const file of cloudFiles) {
      if (file.filename.startsWith(server.name)) {
        const localPath = path.join('/app/backups', file.filename);
        
        // Check if backup exists in DB
        const exists = await this.prisma.backup.findFirst({
          where: {
            filename: file.filename,
            serverId,
          },
        });

        if (!exists) {
          // Download and register
          await this.webdav.downloadFile(file.filename, localPath);
          
          await this.prisma.backup.create({
            data: {
              serverId,
              filename: file.filename,
              path: localPath,
              size: BigInt(file.size),
            },
          });

          synced.push(file.filename);
        }
      }
    }

    return { synced, count: synced.length };
  }

  private createArchive(sourceDir: string, outputPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const output = createWriteStream(outputPath);
      const archive = archiver('tar', {
        gzip: true,
        gzipOptions: { level: 9 },
      });

      output.on('close', () => resolve());
      archive.on('error', (err) => reject(err));

      archive.pipe(output);
      archive.directory(sourceDir, false);
      archive.finalize();
    });
  }
}
