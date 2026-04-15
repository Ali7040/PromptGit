import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ModelAdapterFactory } from '../ai-enhance/adapters/model-adapter.factory';

export interface GeneratedSkill {
  name: string;
  description: string;
  trigger: string;
  content: string; // full SKILL.md markdown
}

/**
 * Generates SKILL.md files from existing prompts.
 * A Skill is a structured, shareable definition of what a prompt does,
 * when to use it, and how to invoke it — following the emerging SKILL.md convention.
 */
@Injectable()
export class SkillGeneratorService {
  constructor(
    private prisma: PrismaService,
    private modelFactory: ModelAdapterFactory,
  ) {}

  async generateFromPrompt(promptId: string, model = 'claude-sonnet-4-6'): Promise<GeneratedSkill> {
    const prompt = await this.prisma.prompt.findUniqueOrThrow({
      where: { id: promptId },
      include: {
        versions: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    const latestContent = prompt.versions[0]?.content ?? '';
    const adapter = this.modelFactory.get(model);

    const systemPrompt = `You are an expert at creating SKILL.md files — structured markdown documents that describe what an AI prompt/skill does, when to use it, and how to invoke it.

A SKILL.md file follows this format:
---
name: <skill-name>
description: <one-line description>
trigger: <when Claude/AI should use this skill, e.g. "TRIGGER when: user asks to...">
model: <preferred model>
---

## Purpose
<2-3 sentences on what this skill accomplishes>

## When to Use
- <trigger condition 1>
- <trigger condition 2>

## When NOT to Use
- <anti-pattern 1>

## Usage

### Basic
<example invocation>

### With Variables
<example with {variables}>

## Expected Output
<description of what the skill produces>

## Notes
<any important caveats, limitations, or tips>

Return JSON: { "name": "...", "description": "...", "trigger": "...", "content": "full SKILL.md markdown here" }`;

    const result = await adapter.complete(
      `Generate a SKILL.md for this prompt:\n\nName: ${prompt.name}\nDescription: ${prompt.description ?? ''}\n\nContent:\n${latestContent}`,
      systemPrompt,
    );

    const jsonMatch = result.match(/\{[\s\S]*\}/);
    const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : {};

    return {
      name: (parsed.name as string) ?? prompt.name,
      description: (parsed.description as string) ?? prompt.description ?? '',
      trigger: (parsed.trigger as string) ?? '',
      content: (parsed.content as string) ?? this.fallbackSkillMd(prompt.name, latestContent),
    };
  }

  private fallbackSkillMd(name: string, content: string): string {
    return `---
name: ${name}
description: A prompt skill
trigger: TRIGGER when: user invokes "${name}"
---

## Purpose
This skill executes the "${name}" prompt.

## Usage

\`\`\`
${content.slice(0, 200)}...
\`\`\`

## Notes
Generated automatically. Review and customize before publishing.
`;
  }
}
