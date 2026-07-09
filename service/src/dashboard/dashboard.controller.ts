import { Controller, Get, Query } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { NotionService } from '../notion/notion.service';
import type { JwtPayload } from '../auth/jwt.strategy';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly notionService: NotionService) {}

  @Get('summary')
  summary(@Query('month') month?: string, @CurrentUser() user?: JwtPayload) {
    return this.notionService.dashboardSummary(
      month ?? new Date().toISOString().slice(0, 7),
      user?.id,
    );
  }
}
