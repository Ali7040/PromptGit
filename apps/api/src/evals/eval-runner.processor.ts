import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';

@Processor('eval-runs')
export class EvalRunnerProcessor extends WorkerHost {
  async process(_job: Job): Promise<void> {}
}
