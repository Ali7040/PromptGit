import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { User } from '@prisma/client';
import { DiffService } from './diff.service';
import { PromptsService } from './prompts.service';
import { CreatePromptDto } from './dto/create-prompt.dto';
import { ListPromptsQueryDto } from './dto/list-prompts-query.dto';
import { Controller, Get, Param, Query } from '@nestjs/common';
import { DiffService } from './diff.service';
import { IsString, IsNotEmpty } from 'class-validator';

class DiffQueryDto {
  @IsString()
  @IsNotEmpty()
  from: string;

  @IsString()
  @IsNotEmpty()
  to: string;
}

@UseGuards(JwtAuthGuard)
@Controller()
export class PromptsController {
  constructor(
    private readonly promptsService: PromptsService,
    private readonly diffService: DiffService,
  ) {}

  @Post('workspaces/:workspaceId/prompts')
  create(
    @Param('workspaceId') workspaceId: string,
    @Body() dto: CreatePromptDto,
    @CurrentUser() user: User,
  ) {
    return this.promptsService.create(workspaceId, user.id, dto);
  }

  @Get('workspaces/:workspaceId/prompts')
  list(
    @Param('workspaceId') workspaceId: string,
    @Query() query: ListPromptsQueryDto,
    @CurrentUser() user: User,
  ) {
    return this.promptsService.list(workspaceId, user.id, query);
  }

  @Get('prompts/:id')
  findOne(@Param('id') id: string) {
    return this.promptsService.findOne(id);
  }

  @Delete('prompts/:id')
  softDelete(@Param('id') id: string, @CurrentUser() user: User) {
    return this.promptsService.softDelete(id, user.id);
  }

  @Get('prompts/:id/diff')
  diff(@Param('id') id: string, @Query() query: DiffQueryDto) {
@Controller('prompts')
export class PromptsController {
  constructor(private readonly diffService: DiffService) {}

  @Get(':id/diff')
  diff(
    @Param('id') id: string,
    @Query() query: DiffQueryDto,
  ) {
    return this.diffService.diffVersions(id, query.from, query.to);
  }
}
