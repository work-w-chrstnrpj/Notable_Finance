import { Controller, Get, Param, Query } from '@nestjs/common';
import { NotionService } from '../notion/notion.service';

@Controller('monthly-monitoring')
export class MonthlyMonitoringController {
  constructor(private readonly notionService: NotionService) {}

  @Get()
  list(@Query('month') month?: string) {
    return this.notionService.monthlyMonitoring(month ?? new Date().toISOString().slice(0, 7));
  }

  @Get(':id')
  detail(@Param('id') id: string) {
    const month = id.replace(/^monitoring-/, '');
    return this.notionService.monthlyMonitoring(month);
  }
}
