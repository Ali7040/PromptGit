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
