import { Module } from '@nestjs/common';
import { AiEnhanceController } from './ai-enhance.controller';
import { AiEnhanceService } from './ai-enhance.service';
import { ModelAdapterFactory } from './adapters/model-adapter.factory';
import { PromptScorerService } from './prompt-scorer.service';

@Module({
  controllers: [AiEnhanceController],
  providers: [AiEnhanceService, ModelAdapterFactory, PromptScorerService],
  exports: [AiEnhanceService],
})
export class AiEnhanceModule {}
