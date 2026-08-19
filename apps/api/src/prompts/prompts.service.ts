import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePromptDto } from './dto/create-prompt.dto';
import { ListPromptsQueryDto } from './dto/list-prompts-query.dto';

@Injectable()
export class PromptsService {
  constructor(private prisma: PrismaService) {}

  async create(workspaceId: string, userId: string, dto: CreatePromptDto) {
    await this.assertMember(workspaceId, userId);

    const slug = await this.buildUniqueSlug(workspaceId, dto.name);

    return this.prisma.prompt.create({
      data: {
        workspaceId,
        name: dto.name,
        description: dto.description,
        tags: dto.tags ?? [],
        slug,
      },
    });
  }

  async list(workspaceId: string, userId: string, query: ListPromptsQueryDto) {
    await this.assertMember(workspaceId, userId);

    const { page, limit } = query;
    const skip = (page - 1) * limit;

    const where = { workspaceId, deletedAt: null };

    const [items, total] = await Promise.all([
      this.prisma.prompt.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.prompt.count({ where }),
    ]);

    return { items, total, page, limit, pages: Math.ceil(total / limit) };
  }

  async findOne(id: string) {
    const prompt = await this.prisma.prompt.findFirst({
      where: { id, deletedAt: null },
      include: {
        versions: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            author: { select: { id: true, username: true, avatarUrl: true } },
          },
        },
      },
    });

    if (!prompt) throw new NotFoundException(`Prompt ${id} not found`);
    return prompt;
  }

  async softDelete(id: string, userId: string) {
    const prompt = await this.prisma.prompt.findFirst({
      where: { id, deletedAt: null },
      include: { workspace: { select: { id: true } } },
    });

    if (!prompt) throw new NotFoundException(`Prompt ${id} not found`);

    await this.assertMember(prompt.workspace.id, userId);

    return this.prisma.prompt.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  private async assertMember(workspaceId: string, userId: string) {
    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
    });
    if (!workspace) throw new NotFoundException(`Workspace not found`);

    const member = await this.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
    });

    const isOwner = workspace.ownerId === userId;
    if (!member && !isOwner) {
      throw new ForbiddenException('You are not a member of this workspace');
    }
  }

  private async buildUniqueSlug(workspaceId: string, name: string): Promise<string> {
    const base = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const existing = await this.prisma.prompt.findUnique({
      where: { workspaceId_slug: { workspaceId, slug: base } },
    });

    if (!existing) return base;

    // Find a unique suffix
    const siblings = await this.prisma.prompt.findMany({
      where: { workspaceId, slug: { startsWith: `${base}-` } },
      select: { slug: true },
    });

    const usedSuffixes = new Set(
      siblings
        .map((p) => parseInt(p.slug.slice(base.length + 1), 10))
        .filter((n) => !isNaN(n)),
    );

    let suffix = 1;
    while (usedSuffixes.has(suffix)) suffix++;
    return `${base}-${suffix}`;
  }
}
