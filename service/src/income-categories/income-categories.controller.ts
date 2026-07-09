import { Controller, Get, Param, Query } from '@nestjs/common';
import { ListQuery } from '../common/finance.types';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { NotionService } from '../notion/notion.service';
import type { JwtPayload } from '../auth/jwt.strategy';

@Controller('income-categories')
export class IncomeCategoriesController {
  constructor(private readonly notionService: NotionService) {}

  @Get()
  list(@Query() query: ListQuery, @CurrentUser() user?: JwtPayload) {
    return this.notionService.list('incomeCategories', query, user?.id);
  }

  @Get(':id')
  detail(@Param('id') id: string, @CurrentUser() user?: JwtPayload) {
    return this.notionService.detail('incomeCategories', id, user?.id);
  }
}
