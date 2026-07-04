import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ListQuery } from '../common/finance.types';
import { NotionService } from '../notion/notion.service';

@Controller('incomes')
export class IncomesController {
  constructor(private readonly notionService: NotionService) {}

  @Get()
  list(@Query() query: ListQuery) {
    return this.notionService.list('incomes', query);
  }

  @Get(':id')
  detail(@Param('id') id: string) {
    return this.notionService.detail('incomes', id);
  }

  @Post()
  create(@Body() body: Record<string, unknown>) {
    return this.notionService.create('incomes', body);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.notionService.update('incomes', id, body);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.notionService.delete('incomes', id);
  }
}
