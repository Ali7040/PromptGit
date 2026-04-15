import { IsEnum, IsOptional, IsString } from 'class-validator';
import { EnhancementType } from '@prisma/client';

export class EnhancePromptDto {
  @IsEnum(EnhancementType)
  type: EnhancementType;

  @IsOptional()
  @IsString()
  model?: string; // defaults to claude-sonnet-4-6
}
