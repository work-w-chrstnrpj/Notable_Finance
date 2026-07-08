import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ListQuery } from '../common/finance.types';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { NotionService } from '../notion/notion.service';

@Controller('expense-scheduler')
export class ExpenseSchedulerController {
  constructor(private readonly notionService: NotionService) {}

  @Get()
  list(@Query() query: ListQuery) {
    return this.notionService.list('expenseScheduler', query);
  }

  @Get(':id')
  detail(@Param('id') id: string) {
    return this.notionService.detail('expenseScheduler', id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() body: Record<string, unknown>) {
    return this.notionService.create('expenseScheduler', body);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.notionService.update('expenseScheduler', id, body);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  delete(@Param('id') id: string) {
    return this.notionService.delete('expenseScheduler', id);
  }
}
