import { Module } from '@nestjs/common';
import { AiEnhanceModule } from '../ai-enhance/ai-enhance.module';
import { SkillsController } from './skills.controller';
import { SkillsService } from './skills.service';
import { SkillGeneratorService } from './skill-generator.service';

@Module({
  imports: [AiEnhanceModule],
  controllers: [SkillsController],
  providers: [SkillsService, SkillGeneratorService],
  exports: [SkillsService],
})
export class SkillsModule {}
