import { Module } from '@nestjs/common';
import { SkillsController } from './skills.controller';
import { SkillsService } from './skills.service';
import { SkillGeneratorService } from './skill-generator.service';

@Module({
  controllers: [SkillsController],
  providers: [SkillsService, SkillGeneratorService],
  exports: [SkillsService],
})
export class SkillsModule {}
