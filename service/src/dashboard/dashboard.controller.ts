import { Controller, Get, Query } from '@nestjs/common';
import { NotionService } from '../notion/notion.service';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly notionService: NotionService) {}

  @Get('summary')
  summary(@Query('month') month?: string) {
    return this.notionService.dashboardSummary(month ?? new Date().toISOString().slice(0, 7));
  }
}
