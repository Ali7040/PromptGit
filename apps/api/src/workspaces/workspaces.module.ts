import { Module } from '@nestjs/common';
import { WorkspacesController } from './workspaces.controller';
import { WorkspacesService } from './workspaces.service';
import { MembersService } from './members.service';

@Module({
  controllers: [WorkspacesController],
  providers: [WorkspacesService, MembersService],
  exports: [WorkspacesService],
})
export class WorkspacesModule {}
