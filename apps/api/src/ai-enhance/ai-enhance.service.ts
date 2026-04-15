import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ModelAdapterFactory } from './adapters/model-adapter.factory';
import { PromptScorerService } from './prompt-scorer.service';
import { EnhancePromptDto } from './dto/enhance-prompt.dto';
import { EnhancementType } from '@prisma/client';
import * as crypto from 'crypto';

@Injectable()
export class AiEnhanceService {
  constructor(
    private prisma: PrismaService,
    private modelFactory: ModelAdapterFactory,
    private scorer: PromptScorerService,
  ) {}

  /**
   * Runs an AI enhancement pass on a prompt version.
   * Returns structured diff + reasoning so users can accept/reject.
   */
  async enhanceVersion(versionId: string, dto: EnhancePromptDto) {
    const version = await this.prisma.promptVersion.findUniqueOrThrow({
      where: { id: versionId },
    });

    const adapter = this.modelFactory.get(dto.model ?? 'claude-sonnet-4-6');
    const systemPrompt = this.buildEnhancementSystemPrompt(dto.type);

    const { enhancedContent, reasoning } = await adapter.enhance(
      version.content,
      systemPrompt,
    );

    const [scoresBefore, scoresAfter] = await Promise.all([
      this.scorer.score(version.content),
      this.scorer.score(enhancedContent),
    ]);

    const diff = this.buildDiff(version.content, enhancedContent);

    return this.prisma.promptEnhancement.create({
      data: {
        versionId,
        model: dto.model ?? 'claude-sonnet-4-6',
        enhancementType: dto.type,
        originalContent: version.content,
        enhancedContent,
        diff,
        reasoning,
        scoresBefore,
        scoresAfter,
      },
    });
  }

  async acceptEnhancement(enhancementId: string, authorId: string) {
    const enhancement = await this.prisma.promptEnhancement.findUniqueOrThrow({
      where: { id: enhancementId },
      include: { version: true },
    });

    const newVersionTag = this.bumpVersion(enhancement.version.versionTag);

    const [newVersion] = await this.prisma.$transaction([
      this.prisma.promptVersion.create({
        data: {
          promptId: enhancement.version.promptId,
          versionTag: newVersionTag,
          content: enhancement.enhancedContent,
          contentHash: this.hashContent(enhancement.enhancedContent),
          commitMsg: `AI enhancement: ${enhancement.enhancementType.toLowerCase().replace(/_/g, ' ')}`,
          variables: enhancement.version.variables as any,
          environment: enhancement.version.environment,
          authorId,
          parentId: enhancement.versionId,
        },
      }),
      this.prisma.promptEnhancement.update({
        where: { id: enhancementId },
        data: { accepted: true },
      }),
    ]);

    return newVersion;
  }

  async getEnhancementHistory(versionId: string) {
    return this.prisma.promptEnhancement.findMany({
      where: { versionId },
      orderBy: { createdAt: 'desc' },
    });
  }

  private buildEnhancementSystemPrompt(type: EnhancementType): string {
    const systemPrompts: Record<EnhancementType, string> = {
      CLARITY: 'You are a prompt engineering expert. Improve the clarity and readability of the given prompt. Make instructions unambiguous and easy to follow. Return JSON: { "enhancedContent": "...", "reasoning": "..." }',
      SPECIFICITY: 'You are a prompt engineering expert. Add specificity: concrete instructions, output format specs, measurable requirements. Return JSON: { "enhancedContent": "...", "reasoning": "..." }',
      SAFETY: 'You are an AI safety expert. Add safety guardrails, content policy instructions, and explicit refusal behavior. Return JSON: { "enhancedContent": "...", "reasoning": "..." }',
      STRUCTURE: 'You are a prompt engineering expert. Improve structure: clear sections, consistent formatting, logical flow. Return JSON: { "enhancedContent": "...", "reasoning": "..." }',
      VARIABLES: 'You are a prompt engineering expert. Extract hardcoded values into {variable_name} syntax. Return JSON: { "enhancedContent": "...", "reasoning": "...", "variables": [...] }',
      CHAIN_OF_THOUGHT: 'You are a prompt engineering expert. Add chain-of-thought reasoning scaffolding to guide step-by-step thinking. Return JSON: { "enhancedContent": "...", "reasoning": "..." }',
      FEW_SHOT: 'You are a prompt engineering expert. Add 2-3 input/output few-shot examples to demonstrate desired behavior. Return JSON: { "enhancedContent": "...", "reasoning": "...", "examples": [...] }',
      FULL_REWRITE: 'You are an expert prompt engineer. Completely rewrite this prompt applying all best practices: clarity, specificity, structure, variables, and safety. Return JSON: { "enhancedContent": "...", "reasoning": "..." }',
    };
    return systemPrompts[type];
  }

  private buildDiff(original: string, enhanced: string): object {
    return {
      original: original.split('\n'),
      enhanced: enhanced.split('\n'),
    };
  }

  private hashContent(content: string): string {
    return crypto.createHash('sha256').update(content).digest('hex').slice(0, 16);
  }

  private bumpVersion(tag: string): string {
    const match = tag.match(/^v?(\d+)\.(\d+)\.(\d+)$/);
    if (!match) return `${tag}-enhanced`;
    return `v${match[1]}.${match[2]}.${parseInt(match[3]) + 1}`;
  }
}
