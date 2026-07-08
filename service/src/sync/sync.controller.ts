import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ResourceName, SyncCommitRequest } from '../common/finance.types';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { NotionService } from '../notion/notion.service';

interface PullRequest {
  resources: ResourceName[];
  scope?: {
    resource?: ResourceName;
    viewMode?: string;
    month?: string;
  };
}

@Controller('sync')
export class SyncController {
  constructor(private readonly notionService: NotionService) {}

  @Get('status')
  status() {
    return this.notionService.syncStatus();
  }

  @Post('pull')
  @UseGuards(JwtAuthGuard)
  pull(@Body() body: PullRequest) {
    return {
      snapshot: this.notionService.pull(body.resources ?? [], body.scope),
      scope: body.scope ?? {},
      pulledAt: new Date().toISOString(),
    };
  }

  @Post('commit')
  @UseGuards(JwtAuthGuard)
  commit(@Body() body: SyncCommitRequest) {
    return this.notionService.commit(
      body.operations ?? [],
      body.returnFreshSnapshot ?? true,
      body.snapshotMonth,
    );
  }
}
