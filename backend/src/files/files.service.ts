import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as fs from 'fs/promises';
import * as path from 'path';
import { createReadStream } from 'fs';

@Injectable()
export class FilesService {
  constructor(private prisma: PrismaService) {}

  async listFiles(serverId: string, directory: string = '') {
    const server = await this.prisma.server.findUnique({
      where: { id: serverId },
    });

    if (!server) {
      throw new BadRequestException('Server not found');
    }

    const fullPath = path.join(server.path, directory);
    
    // Prevent path traversal
    if (!fullPath.startsWith(server.path)) {
      throw new BadRequestException('Invalid path');
    }

    const items = await fs.readdir(fullPath, { withFileTypes: true });
    
    const files = await Promise.all(
      items.map(async (item) => {
        const itemPath = path.join(fullPath, item.name);
        const stats = await fs.stat(itemPath);
        
        return {
          name: item.name,
          path: path.join(directory, item.name),
          isDirectory: item.isDirectory(),
          size: stats.size,
          modified: stats.mtime,
        };
      })
    );

    return files;
  }

  async readFile(serverId: string, filePath: string) {
    const server = await this.prisma.server.findUnique({
      where: { id: serverId },
    });

    const fullPath = path.join(server.path, filePath);
    
    if (!fullPath.startsWith(server.path)) {
      throw new BadRequestException('Invalid path');
    }

    const content = await fs.readFile(fullPath, 'utf-8');
    return { content };
  }

  async writeFile(serverId: string, filePath: string, content: string) {
    const server = await this.prisma.server.findUnique({
      where: { id: serverId },
    });

    const fullPath = path.join(server.path, filePath);
    
    if (!fullPath.startsWith(server.path)) {
      throw new BadRequestException('Invalid path');
    }

    await fs.writeFile(fullPath, content, 'utf-8');
    return { message: 'File saved successfully' };
  }

  async deleteFile(serverId: string, filePath: string) {
    const server = await this.prisma.server.findUnique({
      where: { id: serverId },
    });

    const fullPath = path.join(server.path, filePath);
    
    if (!fullPath.startsWith(server.path)) {
      throw new BadRequestException('Invalid path');
    }

    const stats = await fs.stat(fullPath);
    
    if (stats.isDirectory()) {
      await fs.rm(fullPath, { recursive: true });
    } else {
      await fs.unlink(fullPath);
    }

    return { message: 'Deleted successfully' };
  }

  async createDirectory(serverId: string, dirPath: string) {
    const server = await this.prisma.server.findUnique({
      where: { id: serverId },
    });

    const fullPath = path.join(server.path, dirPath);
    
    if (!fullPath.startsWith(server.path)) {
      throw new BadRequestException('Invalid path');
    }

    await fs.mkdir(fullPath, { recursive: true });
    return { message: 'Directory created' };
  }

  getFileStream(serverId: string, filePath: string) {
    // This will be used for file downloads
    return createReadStream(filePath);
  }
}
