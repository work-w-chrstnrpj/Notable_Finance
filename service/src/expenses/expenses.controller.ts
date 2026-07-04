import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ListQuery } from '../common/finance.types';
import { NotionService } from '../notion/notion.service';

@Controller('expenses')
export class ExpensesController {
  constructor(private readonly notionService: NotionService) {}

  @Get()
  list(@Query() query: ListQuery) {
    return this.notionService.list('expenses', query);
  }

  @Get(':id')
  detail(@Param('id') id: string) {
    return this.notionService.detail('expenses', id);
  }

  @Post()
  create(@Body() body: Record<string, unknown>) {
    return this.notionService.create('expenses', body);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.notionService.update('expenses', id, body);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.notionService.delete('expenses', id);
  }
}
