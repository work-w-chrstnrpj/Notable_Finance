import { Controller, Get, Param, Query } from '@nestjs/common';
import { ListQuery } from '../common/finance.types';
import { NotionService } from '../notion/notion.service';

@Controller('expense-categories')
export class ExpenseCategoriesController {
  constructor(private readonly notionService: NotionService) {}

  @Get()
  list(@Query() query: ListQuery) {
    return this.notionService.list('expenseCategories', query);
  }

  @Get(':id')
  detail(@Param('id') id: string) {
    return this.notionService.detail('expenseCategories', id);
  }
}
