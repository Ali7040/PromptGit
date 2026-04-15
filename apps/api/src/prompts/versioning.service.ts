import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Environment } from '@prisma/client';
import * as crypto from 'crypto';

export interface PushVersionDto {
  content: string;
  commitMsg?: string;
  variables?: VariableDefinition[];
  environment?: Environment;
  model?: string;
  parentVersionId?: string;
}

export interface VariableDefinition {
  name: string;
  description?: string;
  defaultValue?: string;
  required?: boolean;
}

@Injectable()
export class VersioningService {
  constructor(private prisma: PrismaService) {}

  async push(promptId: string, authorId: string, dto: PushVersionDto) {
    const contentHash = this.hash(dto.content);

    // Prevent duplicate content (content-addressable like Git)
    const existing = await this.prisma.promptVersion.findFirst({
      where: { promptId, contentHash },
    });
    if (existing) {
      throw new ConflictException(
        `Identical content already exists as version ${existing.versionTag}`,
      );
    }

    const latest = await this.prisma.promptVersion.findFirst({
      where: { promptId },
      orderBy: { createdAt: 'desc' },
    });

    const versionTag = latest
      ? this.bumpPatch(latest.versionTag)
      : 'v1.0.0';

    return this.prisma.promptVersion.create({
      data: {
        promptId,
        versionTag,
        content: dto.content,
        contentHash,
        commitMsg: dto.commitMsg,
        variables: (dto.variables ?? []) as any,
        environment: dto.environment ?? Environment.DEV,
        model: dto.model,
        authorId,
        parentId: dto.parentVersionId ?? latest?.id,
      },
      include: { author: { select: { id: true, username: true, avatarUrl: true } } },
    });
  }

  async promote(versionId: string, targetEnv: Environment) {
    return this.prisma.promptVersion.update({
      where: { id: versionId },
      data: { environment: targetEnv },
    });
  }

  async getHistory(promptId: string) {
    return this.prisma.promptVersion.findMany({
      where: { promptId },
      orderBy: { createdAt: 'desc' },
      include: {
        author: { select: { id: true, username: true, avatarUrl: true } },
        _count: { select: { evalRuns: true } },
      },
    });
  }

  async getByTag(promptId: string, tag: string) {
    return this.prisma.promptVersion.findUniqueOrThrow({
      where: { promptId_versionTag: { promptId, versionTag: tag } },
    });
  }

  /** Interpolate {variables} in content with provided values */
  interpolate(content: string, values: Record<string, string>): string {
    return content.replace(/{([\w_]+)}/g, (_, key) => values[key] ?? `{${key}}`);
  }

  private hash(content: string): string {
    return crypto.createHash('sha256').update(content).digest('hex').slice(0, 16);
  }

  private bumpPatch(tag: string): string {
    const match = tag.match(/^v?(\d+)\.(\d+)\.(\d+)$/);
    if (!match) return `${tag}.1`;
    return `v${match[1]}.${match[2]}.${parseInt(match[3]) + 1}`;
  }
}
