import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { OptionalJwtAuthGuard } from '../common/guards/optional-jwt-auth.guard';
import { NotionService } from '../notion/notion.service';
import type { JwtPayload } from '../auth/jwt.strategy';

@Controller('dashboard')
@UseGuards(OptionalJwtAuthGuard)
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
