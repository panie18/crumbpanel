import { Module } from '@nestjs/common';
import { PluginsController } from './plugins.controller';

@Module({
  controllers: [PluginsController],
  providers: [],
  exports: [],
})
export class PluginsModule {}
