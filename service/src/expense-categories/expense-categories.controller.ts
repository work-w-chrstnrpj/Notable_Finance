import { Controller, Get, Param, Query } from '@nestjs/common';
import { ListQuery } from '../common/finance.types';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { NotionService } from '../notion/notion.service';
import type { JwtPayload } from '../auth/jwt.strategy';

@Controller('expense-categories')
export class ExpenseCategoriesController {
  constructor(private readonly notionService: NotionService) {}

  @Get()
  list(@Query() query: ListQuery, @CurrentUser() user?: JwtPayload) {
    return this.notionService.list('expenseCategories', query, user?.id);
  }

  @Get(':id')
  detail(@Param('id') id: string, @CurrentUser() user?: JwtPayload) {
    return this.notionService.detail('expenseCategories', id, user?.id);
  }
}
