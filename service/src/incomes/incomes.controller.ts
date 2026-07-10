import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ListQuery } from '../common/finance.types';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../common/guards/optional-jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { NotionService } from '../notion/notion.service';
import type { JwtPayload } from '../auth/jwt.strategy';

@Controller('incomes')
@UseGuards(OptionalJwtAuthGuard)
export class IncomesController {
  constructor(private readonly notionService: NotionService) {}

  @Get()
  list(@Query() query: ListQuery, @CurrentUser() user?: JwtPayload) {
    return this.notionService.list('incomes', query, user?.id);
  }

  @Get(':id')
  detail(@Param('id') id: string, @CurrentUser() user?: JwtPayload) {
    return this.notionService.detail('incomes', id, user?.id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() body: Record<string, unknown>, @CurrentUser() user: JwtPayload) {
    return this.notionService.create('incomes', body, user.id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id') id: string, @Body() body: Record<string, unknown>, @CurrentUser() user: JwtPayload) {
    return this.notionService.update('incomes', id, body, user.id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  delete(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.notionService.delete('incomes', id, user.id);
  }
}
