import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { EvalsController } from './evals.controller';
import { EvalsService } from './evals.service';
import { EvalRunnerProcessor } from './eval-runner.processor';
import { ScoringService } from './scoring.service';

@Module({
  imports: [
    BullModule.registerQueue({ name: 'eval-runs' }),
  ],
  controllers: [EvalsController],
  providers: [EvalsService, EvalRunnerProcessor, ScoringService],
  exports: [EvalsService],
})
export class EvalsModule {}
