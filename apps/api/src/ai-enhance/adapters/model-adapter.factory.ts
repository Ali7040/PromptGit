import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface ModelAdapter {
  enhance(
    content: string,
    systemPrompt: string,
  ): Promise<{ enhancedContent: string; reasoning: string }>;
  complete(prompt: string, system?: string): Promise<string>;
}

/**
 * Factory that returns the right model adapter based on model ID prefix.
 * Add new providers here without changing any calling code.
 */
@Injectable()
export class ModelAdapterFactory {
  constructor(private config: ConfigService) {}

  get(modelId: string): ModelAdapter {
    if (modelId.startsWith('claude')) return new ClaudeAdapter(this.config);
    if (modelId.startsWith('gpt')) return new OpenAIAdapter(this.config);
    throw new Error(`Unsupported model: ${modelId}. Supported prefixes: claude, gpt`);
  }
}

class ClaudeAdapter implements ModelAdapter {
  constructor(private config: ConfigService) {}

  async enhance(content: string, systemPrompt: string) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Anthropic = require('@anthropic-ai/sdk');
    const client = new Anthropic.default({ apiKey: this.config.getOrThrow('ANTHROPIC_API_KEY') });

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: 'user', content: `Enhance this prompt:\n\n${content}` }],
    });

    const raw: string = message.content[0].type === 'text' ? message.content[0].text : '';
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : {};

    return {
      enhancedContent: (parsed.enhancedContent as string) ?? content,
      reasoning: (parsed.reasoning as string) ?? 'No reasoning provided.',
    };
  }

  async complete(prompt: string, system?: string) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Anthropic = require('@anthropic-ai/sdk');
    const client = new Anthropic.default({ apiKey: this.config.getOrThrow('ANTHROPIC_API_KEY') });
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      ...(system ? { system } : {}),
      messages: [{ role: 'user', content: prompt }],
    });
    return message.content[0].type === 'text' ? message.content[0].text : '';
  }
}

class OpenAIAdapter implements ModelAdapter {
  constructor(private config: ConfigService) {}

  async enhance(content: string, systemPrompt: string) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const OpenAI = require('openai');
    const client = new OpenAI.default({ apiKey: this.config.getOrThrow('OPENAI_API_KEY') });

    const response = await client.chat.completions.create({
      model: 'gpt-4o',
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Enhance this prompt:\n\n${content}` },
      ],
    });

    const parsed = JSON.parse(response.choices[0].message.content ?? '{}');
    return {
      enhancedContent: (parsed.enhancedContent as string) ?? content,
      reasoning: (parsed.reasoning as string) ?? 'No reasoning provided.',
    };
  }

  async complete(prompt: string, system?: string) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const OpenAI = require('openai');
    const client = new OpenAI.default({ apiKey: this.config.getOrThrow('OPENAI_API_KEY') });
    const response = await client.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        ...(system ? [{ role: 'system' as const, content: system }] : []),
        { role: 'user', content: prompt },
      ],
    });
    return response.choices[0].message.content ?? '';
  }
}
