import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards, Res } from '@nestjs/common';
import { FilesService } from './files.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Response } from 'express';

@Controller('files')
@UseGuards(JwtAuthGuard)
export class FilesController {
  constructor(private filesService: FilesService) {}

  @Get('server/:serverId')
  listFiles(
    @Param('serverId') serverId: string,
    @Query('dir') directory?: string,
  ) {
    return this.filesService.listFiles(serverId, directory || '');
  }

  @Get('server/:serverId/read')
  readFile(
    @Param('serverId') serverId: string,
    @Query('path') filePath: string,
  ) {
    return this.filesService.readFile(serverId, filePath);
  }

  @Post('server/:serverId/write')
  writeFile(
    @Param('serverId') serverId: string,
    @Body() body: { path: string; content: string },
  ) {
    return this.filesService.writeFile(serverId, body.path, body.content);
  }

  @Delete('server/:serverId')
  deleteFile(
    @Param('serverId') serverId: string,
    @Query('path') filePath: string,
  ) {
    return this.filesService.deleteFile(serverId, filePath);
  }

  @Post('server/:serverId/mkdir')
  createDirectory(
    @Param('serverId') serverId: string,
    @Body() body: { path: string },
  ) {
    return this.filesService.createDirectory(serverId, body.path);
  }
}
