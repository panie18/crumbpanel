import { Injectable } from '@nestjs/common';
import { createClient, WebDAVClient } from 'webdav';
import * as fs from 'fs/promises';
import { createReadStream, createWriteStream } from 'fs';

@Injectable()
export class WebDavService {
  private client: WebDAVClient;
  private enabled: boolean;
  private remotePath: string;

  constructor() {
    const webdavUrl = process.env.WEBDAV_URL;
    const webdavUser = process.env.WEBDAV_USERNAME;
    const webdavPass = process.env.WEBDAV_PASSWORD;
    this.remotePath = process.env.WEBDAV_REMOTE_PATH || '/minecraft-backups';

    if (webdavUrl && webdavUser && webdavPass) {
      this.client = createClient(webdavUrl, {
        username: webdavUser,
        password: webdavPass,
      });
      this.enabled = true;
      console.log('✓ WebDAV Cloud Backup enabled');
    } else {
      this.enabled = false;
      console.log('⚠ WebDAV not configured - cloud backups disabled');
    }
  }

  async uploadFile(localPath: string, filename: string): Promise<void> {
    if (!this.enabled) {
      throw new Error('WebDAV not configured');
    }

    const remotePath = `${this.remotePath}/${filename}`;
    
    // Ensure remote directory exists
    try {
      await this.client.createDirectory(this.remotePath);
    } catch (error) {
      // Directory might already exist
    }

    const fileStream = createReadStream(localPath);
    await this.client.putFileContents(remotePath, fileStream);
  }

  async downloadFile(filename: string, localPath: string): Promise<void> {
    if (!this.enabled) {
      throw new Error('WebDAV not configured');
    }

    const remotePath = `${this.remotePath}/${filename}`;
    const stream = this.client.createReadStream(remotePath);
    const writeStream = createWriteStream(localPath);

    return new Promise((resolve, reject) => {
      stream.pipe(writeStream);
      writeStream.on('finish', () => resolve());
      writeStream.on('error', (err) => reject(err));
    });
  }

  async deleteFile(filename: string): Promise<void> {
    if (!this.enabled) {
      throw new Error('WebDAV not configured');
    }

    const remotePath = `${this.remotePath}/${filename}`;
    await this.client.deleteFile(remotePath);
  }

  async listFiles(): Promise<any[]> {
    if (!this.enabled) {
      return [];
    }

    try {
      const contents = await this.client.getDirectoryContents(this.remotePath);
      return contents
        .filter((item: any) => item.type === 'file')
        .map((item: any) => ({
          filename: item.basename,
          size: item.size,
          lastModified: item.lastmod,
        }));
    } catch (error) {
      return [];
    }
  }

  isEnabled(): boolean {
    return this.enabled;
  }
}
