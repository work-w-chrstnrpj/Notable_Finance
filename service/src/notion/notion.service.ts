import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { ApiException } from '../common/api-exception';
import {
  AccountDto,
  ExpenseCategoryDto,
  ExpenseRecordDto,
  IncomeCategoryDto,
  IncomeRecordDto,
  ListQuery,
  MonthlyMonitoringDto,
  ResourceName,
  SyncOperation,
} from '../common/finance.types';
import { AppConfigService } from '../config/config.service';
import { MappingService } from '../mapping/mapping.service';
import { ValidationService } from '../validation/validation.service';
import { NotionClientFactory } from './notion-client-factory.service';
import { NotionApiClient } from './notion-api-client';
import {
  pageToIncomeRecord,
  pageToExpenseRecord,
  incomeDtoToProperties,
  expenseDtoToProperties,
} from './notion-property-mapper';
import {
  currentMonth,
  isCreditLike,
  isExpenseBacked,
  isIncomeBacked,
} from './notion-resource-utils';
import { LiveCacheManager } from './live-cache-manager';
import { NotionReportingService } from './notion-reporting.service';
import { NotionQueryService } from './notion-query.service';
import { NotionMutationService } from './notion-mutation.service';
import { NotionSyncService } from './notion-sync.service';

export type FinanceRecord =
  | AccountDto
  | IncomeCategoryDto
  | IncomeRecordDto
  | ExpenseCategoryDto
  | ExpenseRecordDto
  | MonthlyMonitoringDto;

const nowIso = () => new Date().toISOString();
export const roundMoney = (value: number) =>
  Math.round((value + Number.EPSILON) * 100) / 100;

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

@Injectable()
export class NotionService {
  private readonly logger = new Logger(NotionService.name);

  constructor(
    private readonly appConfig: AppConfigService,
    private readonly mappingService: MappingService,
    private readonly validationService: ValidationService,
    private readonly clientFactory: NotionClientFactory,
    private readonly cache: LiveCacheManager,
    private readonly reportingService: NotionReportingService,
    private readonly queryService: NotionQueryService,
    private readonly mutationService: NotionMutationService,
    private readonly syncService: NotionSyncService,
  ) {
    // Resolve circular dependency: NotionService ↔ NotionSyncService
    this.syncService.setNotionService(this);
  }

  get isGloballyConfigured(): boolean {
    return this.clientFactory.isGloballyConfigured;
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

  async detail(resource: ResourceName, id: string, userId?: string): Promise<FinanceRecord> {
    await this.cache.loadLive(userId, resource);
    if (this.cache.hasEntry(userId)) {
      const record = this.getCollection(resource, userId).find((item) => item.id === id);
      if (record) return clone(record);
      const liveRecord = await this.cache.loadLiveSingle(userId, resource, id);
      if (liveRecord) return clone(liveRecord);
    }
    const record = this.getCollection(resource, userId).find((item) => item.id === id);
    if (!record) {
      throw new ApiException(
        HttpStatus.NOT_FOUND,
        'NOT_FOUND',
        `${resource} record was not found.`,
        { resource, id },
      );
    }
    return clone(record);
  }

  async create(resource: ResourceName, data: Record<string, unknown>, userId?: string): Promise<FinanceRecord> {
    this.validationService.validateMutation(resource, 'create', data);

    await this.cache.loadLive(userId, resource);
    const properties = this.buildNotionProperties(resource, data, userId);
    const page = await this.mutationService.createPage(resource, properties, userId);

    const createdRecord = isIncomeBacked(resource)
      ? (pageToIncomeRecord(page) as FinanceRecord)
      : (pageToExpenseRecord(page) as FinanceRecord);
    this.syncService.addSyncEvent('create', resource, `Created ${createdRecord.id}`);
    return clone(createdRecord);
  }

  async update(resource: ResourceName, id: string, data: Record<string, unknown>, userId?: string): Promise<FinanceRecord> {
    this.validationService.validateMutation(resource, 'update', data);

    await this.cache.loadLive(userId, resource);
    const properties = this.buildNotionProperties(resource, data, userId);
    const page = await this.mutationService.updatePage(resource, id, properties, userId);

    const updatedRecord = isIncomeBacked(resource)
      ? (pageToIncomeRecord(page) as FinanceRecord)
      : (pageToExpenseRecord(page) as FinanceRecord);

    this.syncService.addSyncEvent('update', resource, `Updated ${id}`);
    return clone(updatedRecord);
  }

  async delete(resource: ResourceName, id: string, userId?: string): Promise<FinanceRecord> {
    this.validationService.validateMutation(resource, 'delete');
    const mapping = this.mappingService.get(resource);

    await this.cache.loadLive(userId, resource);
    const record = await this.detail(resource, id, userId);
    const softDeleteData =
      mapping.deletePolicy === 'incomeSoftDelete' && 'grossIncome' in record
        ? {
            name: `${(record as IncomeRecordDto).name} [Deleted: ${(record as IncomeRecordDto).grossIncome}]`,
            grossIncome: 0,
          }
        : mapping.deletePolicy === 'expenseSoftDelete' && 'amount' in record
          ? {
              description: `${(record as ExpenseRecordDto).description} [Deleted: ${(record as ExpenseRecordDto).amount}]`,
              amount: 0,
            }
          : {};

    const properties = this.buildNotionProperties(resource, softDeleteData as Record<string, unknown>, userId);
    const page = await this.mutationService.deletePage(resource, id, properties, userId);

    const deletedRecord = isIncomeBacked(resource)
      ? (pageToIncomeRecord(page) as FinanceRecord)
      : (pageToExpenseRecord(page) as FinanceRecord);

    Object.assign(deletedRecord, { deleted: true });
    this.syncService.addSyncEvent('delete', resource, `Soft-deleted ${id}`);
    return clone(deletedRecord);
  }

  async bulkDelete(
    resource: ResourceName,
    ids: string[],
    userId?: string,
  ): Promise<{ deleted: string[]; failed: { id: string; error: string }[] }> {
    this.validationService.validateMutation(resource, 'delete');
    const deleted: string[] = [];
    const failed: { id: string; error: string }[] = [];

    for (const id of ids) {
      try {
        await this.delete(resource, id, userId);
        deleted.push(id);
      } catch (err) {
        failed.push({
          id,
          error: err instanceof Error ? err.message : 'Unknown error',
        });
      }
      // Small delay between calls to respect Notion rate limits (3 req/s)
      if (ids.length > 1) {
        await new Promise((resolve) => setTimeout(resolve, 350));
      }
    }

    return { deleted, failed };
  }

  async bulkCreate(
    resource: ResourceName,
    items: Record<string, unknown>[],
    userId?: string,
  ): Promise<{ created: FinanceRecord[]; failed: { index: number; error: string }[] }> {
    const created: FinanceRecord[] = [];
    const failed: { index: number; error: string }[] = [];

    for (let i = 0; i < items.length; i++) {
      try {
        const record = await this.create(resource, items[i], userId);
        created.push(record);
      } catch (err) {
        failed.push({
          index: i,
          error: err instanceof Error ? err.message : 'Unknown error',
        });
      }
      // Delay between calls to respect Notion rate limits (3 req/s)
      if (items.length > 1) {
        await new Promise((resolve) => setTimeout(resolve, 350));
      }
    }

    return { created, failed };
  }

  async pull(
    resources: ResourceName[],
    scope?: { month?: string; viewMode?: string },
    userId?: string,
  ): Promise<Record<string, FinanceRecord[]>> {
    return this.syncService.pull(resources, scope, userId);
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
    return this.syncService.commit(operations, returnFreshSnapshot, snapshotMonth, userId);
  }

  async syncStatus(userId?: string): Promise<{
    lastSyncAt: string | null;
    pendingOperationCount: number;
    failedOperationCount: number;
    schemaStatus: string;
  }> {
    return this.syncService.syncStatus(userId);
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
    return this.syncService.schemaStatus(userId);
  }

  async dashboardSummary(month: string, userId?: string) {
    return this.reportingService.dashboardSummary(month, userId);
  }

  async monthlyMonitoring(month: string, userId?: string): Promise<MonthlyMonitoringDto> {
    return this.reportingService.monthlyMonitoring(month, userId);
  }

  private buildNotionProperties(
    resource: ResourceName,
    data: Record<string, unknown>,
    userId?: string,
  ): Record<string, unknown> {
    if (isIncomeBacked(resource)) {
      const mapping = this.mappingService.get(resource);
      let categoryOverride: string | undefined;
      if (mapping.fixedCategory !== undefined) {
        const useProvided =
          mapping.categoryEditable && typeof data.categoryId === 'string' && data.categoryId;
        categoryOverride = useProvided
          ? undefined
          : this.queryService.findIncomeCategoryId(mapping.fixedCategory, userId);
      }
      return incomeDtoToProperties(data, { categoryOverride });
    }

    if (isExpenseBacked(resource)) {
      return expenseDtoToProperties(data);
    }

    throw new ApiException(
      HttpStatus.INTERNAL_SERVER_ERROR,
      'INTERNAL_SERVER_ERROR',
      `Cannot build Notion properties for resource: ${resource}`,
      { resource },
    );
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
