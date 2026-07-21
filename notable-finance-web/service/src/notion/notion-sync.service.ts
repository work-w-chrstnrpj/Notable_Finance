import { HttpStatus, Injectable } from '@nestjs/common';
import { ApiException } from '../common/api-exception';
import { randomUUID } from 'node:crypto';
import {
  AccountDto,
  ExpenseCategoryDto,
  ExpenseRecordDto,
  FinanceRecord,
  IncomeCategoryDto,
  IncomeRecordDto,
  ListQuery,
  MonthlyMonitoringDto,
  ResourceName,
  SyncOperation,
} from '../common/finance.types';
import { AppConfigService } from '../config/config.service';
import { MappingService } from '../mapping/mapping.service';
import { NotionClientFactory } from './notion-client-factory.service';
import { NotionApiClient } from './notion-api-client';
import {
  pageToAccount,
  pageToExpenseCategory,
  pageToExpenseRecord,
  pageToIncomeCategory,
  pageToIncomeRecord,
} from './notion-property-mapper';
import {
  currentMonth,
  isExpenseBacked,
  isIncomeBacked,
} from './notion-resource-utils';
import { LiveCacheManager } from './live-cache-manager';
import { NotionMutationService } from './notion-mutation.service';
import { NotionQueryService } from './notion-query.service';
import { NotionService } from './notion.service';

/**
 * Owns sync orchestration: pull, commit, syncStatus, schemaStatus, sync event log.
 * Extracted from NotionService (P4-3 step 6).
 * Uses a setter for NotionService to break circular dependency (NotionService ↔ NotionSyncService).
 */
@Injectable()
export class NotionSyncService {
  private readonly syncEvents: Array<{
    id: string;
    type: string;
    resource: string;
    description: string;
    timestamp: string;
  }> = [];

  private notionService: NotionService | null = null;

  constructor(
    private readonly appConfig: AppConfigService,
    private readonly mappingService: MappingService,
    private readonly clientFactory: NotionClientFactory,
    private readonly cache: LiveCacheManager,
    private readonly mutationService: NotionMutationService,
    private readonly queryService: NotionQueryService,
  ) {}

  setNotionService(notionService: NotionService): void {
    this.notionService = notionService;
  }

  private getService(): NotionService {
    if (!this.notionService) {
      throw new Error('NotionSyncService.notionService not set - circular dependency not resolved');
    }
    return this.notionService;
  }

  private ensureNotionConfigured(client: NotionApiClient | null): asserts client is NotionApiClient {
    if (!client) {
      throw new ApiException(
        HttpStatus.PRECONDITION_REQUIRED,
        'NOTION_NOT_CONFIGURED',
        'Notion integration is not configured for this user. Save your Notion token and database IDs in Settings first.',
      );
    }
  }

  addSyncEvent(type: string, resource: string, description: string): void {
    this.syncEvents.push({
      id: randomUUID(),
      type,
      resource,
      description,
      timestamp: new Date().toISOString(),
    });
  }

  async pull(
    resources: ResourceName[],
    scope?: { month?: string; viewMode?: string },
    userId?: string,
  ): Promise<Record<string, FinanceRecord[]>> {
    this.cache.refreshCache(userId);
    await this.cache.loadLive(userId, 'accounts');
    const snapshot: Record<string, FinanceRecord[]> = {};
    for (const resource of resources) {
      snapshot[resource] = (await this.list(resource, {
        month: scope?.month,
        viewMode: scope?.viewMode,
        expenseViewMode: scope?.viewMode,
      }, userId)) as FinanceRecord[];
    }
    return snapshot;
  }

  async list(resource: ResourceName, query: ListQuery = {}, userId?: string): Promise<FinanceRecord[]> {
    if (resource === 'monthlyMonitoring') {
      const month = query.month ?? currentMonth();
      return [await this.monthlyMonitoring(month, userId)] as FinanceRecord[];
    }
    await this.cache.loadLive(userId, resource);
    const records = this.getCollection(resource, userId);
    return this.queryService.applyQuery(resource, records, query, userId);
  }

  private async monthlyMonitoring(month: string, userId?: string): Promise<MonthlyMonitoringDto> {
    await this.cache.loadLive(userId, 'incomes');
    await this.cache.loadLive(userId, 'accounts');

    const incomes = (await this.list('incomes', { month }, userId)).filter(
      (record) => !('deleted' in record) || !record.deleted,
    ) as IncomeRecordDto[];

    const expenses = (await this.list('expenses', { month }, userId)).filter(
      (record) => !('deleted' in record) || !record.deleted,
    ) as ExpenseRecordDto[];

    const expenseCategories = this.cache.getCollectedExpenseCategories(userId);
    const incomeCategories = this.cache.getCollectedIncomeCategories(userId);

    const roundMoney = (value: number) =>
      Math.round((value + Number.EPSILON) * 100) / 100;

    const monthlyGrossIncome = roundMoney(
      incomes.reduce((sum, item) => sum + item.grossIncome, 0),
    );
    const monthlyIncome = roundMoney(
      incomes.reduce((sum, item) => sum + item.grossIncome - item.capitalExpenditure, 0),
    );
    const monthlyExpense = roundMoney(
      expenses.reduce((sum, item) => sum + item.amount + item.interest, 0),
    );
    const categoryRows = expenseCategories.map((category) => {
      const spending = roundMoney(
        expenses
          .filter((expense) => expense.categoryId === category.id)
          .reduce((sum, expense) => sum + expense.amount + expense.interest, 0),
      );
      return {
        id: category.id,
        name: category.name,
        budget: category.monthlyBudget,
        spending,
        remaining: roundMoney(category.monthlyBudget - spending),
        totalOverview:
          monthlyExpense > 0 ? roundMoney((spending / monthlyExpense) * 100) : 0,
      };
    });

    return {
      id: `monitoring-${month}`,
      month,
      monthlyIncome,
      monthlyGrossIncome,
      monthlyExpense,
      grossMargin: roundMoney(monthlyIncome - monthlyExpense),
      forNeeds: roundMoney(monthlyIncome * 0.5),
      forWants: roundMoney(monthlyIncome * 0.3),
      forSavings: roundMoney(monthlyIncome * 0.2),
      incomeCategories: incomeCategories.map((category) => ({
        id: category.id,
        source: category.source,
        total: roundMoney(
          incomes
            .filter((income) => income.categoryId === category.id)
            .reduce((sum, income) => sum + income.grossIncome - income.capitalExpenditure, 0),
        ),
      })),
      expenseCategories: categoryRows,
    };
  }

  async commit(
    operations: SyncOperation[],
    returnFreshSnapshot = false,
    snapshotMonth?: string,
    userId?: string,
  ): Promise<{
    applied: Array<{ clientOperationId: string; resource: ResourceName; id: string }>;
    failed: Array<{
      clientOperationId: string;
      resource: ResourceName;
      code: string;
      message: string;
      details?: Record<string, unknown>;
    }>;
    freshSnapshot?: Record<string, FinanceRecord[]>;
  }> {
    const applied: Array<{ clientOperationId: string; resource: ResourceName; id: string }> = [];
    const failed: Array<{
      clientOperationId: string;
      resource: ResourceName;
      code: string;
      message: string;
      details?: Record<string, unknown>;
    }> = [];

    for (const operation of operations) {
      try {
        const result: FinanceRecord =
          operation.action === 'create'
            ? await this.getService().create(operation.resource, operation.data ?? {}, userId)
            : operation.action === 'update'
              ? await this.getService().update(operation.resource, this.requireId(operation), operation.data ?? {}, userId)
              : await this.getService().delete(operation.resource, this.requireId(operation), userId);

        applied.push({
          clientOperationId: operation.clientOperationId,
          resource: operation.resource,
          id: result.id,
        });
      } catch (error) {
        const response =
          error instanceof ApiException
            ? (error.getResponse() as {
                code: string;
                message: string;
                details?: Record<string, unknown>;
              })
            : {
                code: 'INTERNAL_SERVER_ERROR',
                message: 'Unexpected sync operation failure.',
              };
        failed.push({
          clientOperationId: operation.clientOperationId,
          resource: operation.resource,
          code: response.code,
          message: response.message,
          details: response.details,
        });
      }
    }

    this.addSyncEvent(
      failed.length > 0 ? 'error' : 'pull',
      'sync',
      `Committed ${applied.length} operations with ${failed.length} failures`,
    );

    return {
      applied,
      failed,
      freshSnapshot: returnFreshSnapshot
        ? await this.pull(
            ['accounts', 'incomeCategories', 'expenseCategories', 'incomes', 'expenses'],
            {
              month: snapshotMonth,
              viewMode: 'monthly',
            },
            userId,
          )
        : undefined,
    };
  }

  async syncStatus(userId?: string): Promise<{
    lastSyncAt: string | null;
    pendingOperationCount: number;
    failedOperationCount: number;
    schemaStatus: string;
  }> {
    const client = await this.clientFactory.getClient(userId);
    const schema = await this.schemaStatus(userId);
    return {
      lastSyncAt: this.syncEvents.at(-1)?.timestamp ?? null,
      pendingOperationCount: 0,
      failedOperationCount: this.syncEvents.filter((event) => event.type === 'error').length,
      schemaStatus: client ? 'live' : (this.clientFactory.isGloballyConfigured ? 'live' : schema.status),
    };
  }

  async schemaStatus(userId?: string): Promise<{
    status: string;
    checkedAt: string;
    configured: boolean;
    missing: string[];
    checks: Array<{
      resource: string;
      notionSource: string;
      status: string;
      requiredWritableFields: string[];
      readOnly: boolean;
    }>;
  }> {
    const client = await this.clientFactory.getClient(userId);
    const missing = this.appConfig.missingRequiredNotionConfig;
    const configured = client !== null;

    if (client) {
      const checks = this.mappingService.getAll().map((mapping) => ({
        resource: mapping.resource,
        notionSource: mapping.notionSource,
        status: 'live' as const,
        requiredWritableFields: mapping.writableFields,
        readOnly: mapping.readOnly,
      }));
      return {
        status: configured ? 'configured' : 'notConfigured',
        checkedAt: new Date().toISOString(),
        configured,
        missing,
        checks,
      };
    }

    return {
      status: configured ? 'configured' : 'notConfigured',
      checkedAt: new Date().toISOString(),
      configured,
      missing,
      checks: this.mappingService.getAll().map((mapping) => ({
        resource: mapping.resource,
        notionSource: mapping.notionSource,
        status: configured ? 'pendingLiveVerification' : 'notChecked',
        requiredWritableFields: mapping.writableFields,
        readOnly: mapping.readOnly,
      })),
    };
  }

  private requireId(operation: SyncOperation): string {
    if (!operation.id) {
      throw new ApiException(
        HttpStatus.BAD_REQUEST,
        'VALIDATION_ERROR',
        'Sync operation id is required for update and delete actions.',
        { operation },
      );
    }
    return operation.id;
  }

  private getCollection(resource: ResourceName, userId?: string): FinanceRecord[] {
    if (resource === 'accounts') return this.cache.getCollectedAccounts(userId);
    if (resource === 'incomeCategories') return this.cache.getCollectedIncomeCategories(userId);
    if (resource === 'expenseCategories') return this.cache.getCollectedExpenseCategories(userId);
    if (isIncomeBacked(resource)) return this.cache.getCollectedIncomes(userId);
    if (isExpenseBacked(resource)) return this.cache.getCollectedExpenses(userId);
    return [];
  }
}
