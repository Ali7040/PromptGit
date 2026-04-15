import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { AuthModule } from './auth/auth.module';
import { WorkspacesModule } from './workspaces/workspaces.module';
import { PromptsModule } from './prompts/prompts.module';
import { AiEnhanceModule } from './ai-enhance/ai-enhance.module';
import { SkillsModule } from './skills/skills.module';
import { EvalsModule } from './evals/evals.module';
import { MarketplaceModule } from './marketplace/marketplace.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { StorageModule } from './storage/storage.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
    PrismaModule,
    RedisModule,
    AuthModule,
    WorkspacesModule,
    PromptsModule,
    AiEnhanceModule,
    SkillsModule,
    EvalsModule,
    MarketplaceModule,
    AnalyticsModule,
    StorageModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
