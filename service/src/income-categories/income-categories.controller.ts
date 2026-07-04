import { Controller, Get, Param, Query } from '@nestjs/common';
import { ListQuery } from '../common/finance.types';
import { NotionService } from '../notion/notion.service';

@Controller('income-categories')
export class IncomeCategoriesController {
  constructor(private readonly notionService: NotionService) {}

  @Get()
  list(@Query() query: ListQuery) {
    return this.notionService.list('incomeCategories', query);
  }

  @Get(':id')
  detail(@Param('id') id: string) {
    return this.notionService.detail('incomeCategories', id);
  }
}
