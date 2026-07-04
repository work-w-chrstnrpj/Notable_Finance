import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ListQuery, ResourceName } from '../common/finance.types';
import { NotionService } from '../notion/notion.service';

abstract class WorkflowController {
  protected constructor(
    protected readonly notionService: NotionService,
    private readonly resource: ResourceName,
  ) {}

  @Get()
  list(@Query() query: ListQuery) {
    return this.notionService.list(this.resource, query);
  }

  @Get(':id')
  detail(@Param('id') id: string) {
    return this.notionService.detail(this.resource, id);
  }

  @Post()
  create(@Body() body: Record<string, unknown>) {
    return this.notionService.create(this.resource, body);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.notionService.update(this.resource, id, body);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.notionService.delete(this.resource, id);
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
