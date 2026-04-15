import { Module } from '@nestjs/common';
import { PromptsController } from './prompts.controller';
import { PromptsService } from './prompts.service';
import { VersioningService } from './versioning.service';
import { DiffService } from './diff.service';

@Module({
  controllers: [PromptsController],
  providers: [PromptsService, VersioningService, DiffService],
  exports: [PromptsService],
})
export class PromptsModule {}
