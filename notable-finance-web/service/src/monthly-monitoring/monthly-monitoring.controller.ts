import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { OptionalJwtAuthGuard } from '../common/guards/optional-jwt-auth.guard';
import { NotionService } from '../notion/notion.service';
import type { JwtPayload } from '../auth/jwt.strategy';

@Controller('monthly-monitoring')
@UseGuards(OptionalJwtAuthGuard)
export class MonthlyMonitoringController {
  constructor(private readonly notionService: NotionService) {}

  @Get()
  list(@Query('month') month?: string, @CurrentUser() user?: JwtPayload) {
    return this.notionService.monthlyMonitoring(
      month ?? new Date().toISOString().slice(0, 7),
      user?.id,
    );
  }

  @Get(':id')
  detail(@Param('id') id: string, @CurrentUser() user?: JwtPayload) {
    const month = id.replace(/^monitoring-/, '');
    return this.notionService.monthlyMonitoring(month, user?.id);
  }
}
