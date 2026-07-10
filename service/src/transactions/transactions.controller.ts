import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ListQuery, ResourceName } from '../common/finance.types';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../common/guards/optional-jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { NotionService } from '../notion/notion.service';
import type { JwtPayload } from '../auth/jwt.strategy';

abstract class WorkflowController {
  protected constructor(
    protected readonly notionService: NotionService,
    private readonly resource: ResourceName,
  ) {}

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  list(@Query() query: ListQuery, @CurrentUser() user?: JwtPayload) {
    return this.notionService.list(this.resource, query, user?.id);
  }

  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  detail(@Param('id') id: string, @CurrentUser() user?: JwtPayload) {
    return this.notionService.detail(this.resource, id, user?.id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() body: Record<string, unknown>, @CurrentUser() user: JwtPayload) {
    return this.notionService.create(this.resource, body, user.id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id') id: string, @Body() body: Record<string, unknown>, @CurrentUser() user: JwtPayload) {
    return this.notionService.update(this.resource, id, body, user.id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  delete(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.notionService.delete(this.resource, id, user.id);
  }
}

@Controller('transactions')
export class TransactionsController extends WorkflowController {
  constructor(notionService: NotionService) {
    super(notionService, 'transactions');
  }
}

@Controller('transfers')
export class TransfersController extends WorkflowController {
  constructor(notionService: NotionService) {
    super(notionService, 'transfers');
  }
}

@Controller('credit-card-payments')
export class CreditCardPaymentsController extends WorkflowController {
  constructor(notionService: NotionService) {
    super(notionService, 'creditCardPayments');
  }
}

@Controller('alkansya')
export class AlkansyaController extends WorkflowController {
  constructor(notionService: NotionService) {
    super(notionService, 'alkansya');
  }
}

@Controller('receivables')
export class ReceivablesController extends WorkflowController {
  constructor(notionService: NotionService) {
    super(notionService, 'receivables');
  }
}
