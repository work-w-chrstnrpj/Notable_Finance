import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ResourceName, SyncCommitRequest } from '../common/finance.types';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { NotionService } from '../notion/notion.service';
import type { JwtPayload } from '../auth/jwt.strategy';

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
  status(@CurrentUser() user?: JwtPayload) {
    return this.notionService.syncStatus(user?.id);
  }

  @Post('pull')
  @UseGuards(JwtAuthGuard)
  pull(@Body() body: PullRequest, @CurrentUser() user: JwtPayload) {
    return {
      snapshot: this.notionService.pull(body.resources ?? [], body.scope, user.id),
      scope: body.scope ?? {},
      pulledAt: new Date().toISOString(),
    };
  }

  @Post('commit')
  @UseGuards(JwtAuthGuard)
  commit(@Body() body: SyncCommitRequest, @CurrentUser() user: JwtPayload) {
    return this.notionService.commit(
      body.operations ?? [],
      body.returnFreshSnapshot ?? true,
      body.snapshotMonth,
      user.id,
    );
  }
}
