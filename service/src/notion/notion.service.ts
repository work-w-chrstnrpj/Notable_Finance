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
  ResourceName,
  SyncOperation,
} from '../common/finance.types';
import { AppConfigService } from '../config/config.service';
import { MappingService } from '../mapping/mapping.service';
import { ValidationService } from '../validation/validation.service';
import { NotionClientFactory } from './notion-client-factory.service';
import { NotionApiClient } from './notion-api-client';
import {
  pageToAccount,
  pageToExpenseCategory,
  pageToExpenseRecord,
  pageToIncomeCategory,
  pageToIncomeRecord,
  incomeDtoToProperties,
  expenseDtoToProperties,
} from './notion-property-mapper';
import {
  currentMonth,
  filterByMonth,
  filterByRange,
  isCreditLike,
  isExpenseBacked,
  isIncomeBacked,
} from './notion-resource-utils';
import { LiveCacheManager } from './live-cache-manager';

export type FinanceRecord =
  | AccountDto
  | IncomeCategoryDto
  | IncomeRecordDto
  | ExpenseCategoryDto
  | ExpenseRecordDto
  | MonthlyMonitoringDto;

export interface MonthlyMonitoringDto {
  id: string;
  month: string;
  monthlyIncome: number;
  monthlyGrossIncome: number;
  monthlyExpense: number;
  grossMargin: number;
  forNeeds: number;
  forWants: number;
  forSavings: number;
  incomeCategories: Array<{ id: string; source: string; total: number }>;
  expenseCategories: Array<{
    id: string;
    name: string;
    budget: number;
    spending: number;
    remaining: number;
    totalOverview: number;
  }>;
}

const nowIso = () => new Date().toISOString();
const roundMoney = (value: number) =>
  Math.round((value + Number.EPSILON) * 100) / 100;

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

@Injectable()
export class NotionService {
  private readonly logger = new Logger(NotionService.name);
  private readonly syncEvents: Array<{
    id: string;
    type: string;
    resource: string;
    description: string;
    timestamp: string;
  }> = [];

  /** Owns the per-user in-memory Notion cache (freshness, single-flight, loaders). */
  private readonly cache: LiveCacheManager;

  constructor(
    private readonly appConfig: AppConfigService,
    private readonly mappingService: MappingService,
    private readonly validationService: ValidationService,
    private readonly clientFactory: NotionClientFactory,
  ) {
    this.cache = new LiveCacheManager(appConfig, clientFactory);
  }

  get isGloballyConfigured(): boolean {
    return this.clientFactory.isGloballyConfigured;
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

  async list(resource: ResourceName, query: ListQuery = {}, userId?: string): Promise<FinanceRecord[]> {
    if (resource === 'monthlyMonitoring') {
      const month = query.month ?? currentMonth();
      return [await this.monthlyMonitoring(month, userId)] as FinanceRecord[];
    }
    await this.cache.loadLive(userId, resource);
    const records = this.getCollection(resource, userId);
    return this.applyQuery(resource, records, query, userId);
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
    await this.cache.loadLive(userId, resource);
    this.validationService.validateMutation(resource, 'create', data);

    const client = await this.cache.getLiveClient(userId);
    this.ensureNotionConfigured(client);

    try {
      const properties = this.buildNotionProperties(resource, data);
      const page = await client.createPage(resource, properties);
      this.cache.refreshCacheFor(userId, resource);
      const createdRecord = isIncomeBacked(resource)
        ? (pageToIncomeRecord(page) as FinanceRecord)
        : (pageToExpenseRecord(page) as FinanceRecord);
      this.addSyncEvent('create', resource, `Created ${createdRecord.id}`);
      return clone(createdRecord);
    } catch (error) {
      this.logError('create', resource, error);
      throw error;
    }
  }

  async update(resource: ResourceName, id: string, data: Record<string, unknown>, userId?: string): Promise<FinanceRecord> {
    await this.cache.loadLive(userId, resource);
    this.validationService.validateMutation(resource, 'update', data);

    const client = await this.cache.getLiveClient(userId);
    this.ensureNotionConfigured(client);

    try {
      const properties = this.buildNotionProperties(resource, data);
      const page = await client.updatePage(id, properties);
      this.cache.refreshCacheFor(userId, resource);

      const updatedRecord = isIncomeBacked(resource)
        ? (pageToIncomeRecord(page) as FinanceRecord)
        : (pageToExpenseRecord(page) as FinanceRecord);

      this.addSyncEvent('update', resource, `Updated ${id}`);
      return clone(updatedRecord);
    } catch (error) {
      this.logError('update', resource, error);
      throw error;
    }
  }

  async delete(resource: ResourceName, id: string, userId?: string): Promise<FinanceRecord> {
    await this.cache.loadLive(userId, resource);
    this.validationService.validateMutation(resource, 'delete');
    const mapping = this.mappingService.get(resource);

    const client = await this.cache.getLiveClient(userId);
    this.ensureNotionConfigured(client);

    try {
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

      const properties = this.buildNotionProperties(resource, softDeleteData as Record<string, unknown>);
      const page = await client.updatePage(id, properties);
      this.cache.refreshCacheFor(userId, resource);

      const deletedRecord = isIncomeBacked(resource)
        ? (pageToIncomeRecord(page) as FinanceRecord)
        : (pageToExpenseRecord(page) as FinanceRecord);

      Object.assign(deletedRecord, { deleted: true });
      this.addSyncEvent('delete', resource, `Soft-deleted ${id}`);
      return clone(deletedRecord);
    } catch (error) {
      this.logError('delete', resource, error);
      throw error;
    }
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
            ? await this.create(operation.resource, operation.data ?? {}, userId)
            : operation.action === 'update'
              ? await this.update(operation.resource, this.requireId(operation), operation.data ?? {}, userId)
              : await this.delete(operation.resource, this.requireId(operation), userId);

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
        checkedAt: nowIso(),
        configured,
        missing,
        checks,
      };
    }

    return {
      status: configured ? 'configured' : 'notConfigured',
      checkedAt: nowIso(),
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

  async dashboardSummary(month: string, userId?: string): Promise<{
    month: string;
    totalIncome: number;
    totalExpense: number;
    grossMargin: number;
    totalCashFlow: number;
    activeAccountCount: number;
    pendingExpenseCount: number;
  }> {
    await this.cache.loadLive(userId, 'incomes');
    await this.cache.loadLive(userId, 'accounts');

    const incomes = (await this.list('incomes', { month }, userId)).filter(
      (record) => !('deleted' in record) || !record.deleted,
    ) as IncomeRecordDto[];

    const expenses = (await this.list('expenses', { month }, userId)).filter(
      (record) => !('deleted' in record) || !record.deleted,
    ) as ExpenseRecordDto[];

    const accounts = this.cache.getCollectedAccounts(userId);
    const totalIncome = roundMoney(
      incomes.reduce((sum, item) => sum + item.grossIncome - item.capitalExpenditure, 0),
    );
    const totalExpense = roundMoney(
      expenses.reduce((sum, item) => sum + item.amount + item.interest, 0),
    );
    const totalCashFlow = roundMoney(
      accounts
        .filter((account) => !account.inactive && !isCreditLike(account.type))
        .reduce((sum, account) => sum + account.currentBalance, 0),
    );

    return {
      month,
      totalIncome,
      totalExpense,
      grossMargin: roundMoney(totalIncome - totalExpense),
      totalCashFlow,
      activeAccountCount: accounts.filter((account) => !account.inactive).length,
      pendingExpenseCount: expenses.filter((expense) => expense.datePaid === null).length,
    };
  }

  async monthlyMonitoring(month: string, userId?: string): Promise<MonthlyMonitoringDto> {
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

  private buildNotionProperties(
    resource: ResourceName,
    data: Record<string, unknown>,
  ): Record<string, unknown> {
    if (isIncomeBacked(resource)) {
      const mapping = this.mappingService.get(resource);
      // Locked-category workflows (transfer, CC payment) always write the fixed
      // category. Editable-category workflows (Alkansya) honour a provided
      // categoryId — letting the user move the record out of the bucket — and
      // fall back to the fixed default when none is given.
      let categoryOverride: string | undefined;
      if (mapping.fixedCategory !== undefined) {
        const useProvided =
          mapping.categoryEditable && typeof data.categoryId === 'string' && data.categoryId;
        categoryOverride = useProvided
          ? undefined
          : this.findIncomeCategoryId(mapping.fixedCategory);
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

  private findIncomeCategoryId(source: string): string {
    const category = this.cache.getCollectedIncomeCategories().find((item) => item.source === source);
    if (!category) {
      throw new ApiException(
        HttpStatus.INTERNAL_SERVER_ERROR,
        'INTERNAL_SERVER_ERROR',
        `Required income category is not configured: ${source}`,
      );
    }
    return category.id;
  }

  private findExpenseCategoryId(name: string): string {
    const category = this.cache.getCollectedExpenseCategories().find((item) => item.name === name);
    if (!category) {
      throw new ApiException(
        HttpStatus.INTERNAL_SERVER_ERROR,
        'INTERNAL_SERVER_ERROR',
        `Required expense category is not configured: ${name}`,
      );
    }
    return category.id;
  }

  private async applyQuery(
    resource: ResourceName,
    records: FinanceRecord[],
    query: ListQuery,
    userId?: string,
  ): Promise<FinanceRecord[]> {
    let filtered = records.filter((item) => !('deleted' in item) || !item.deleted);

    if (resource === 'accounts') {
      const includeInactive = (query as Record<string, unknown>).includeInactive === 'true';
      filtered = includeInactive
        ? filtered
        : filtered.filter((item) => 'inactive' in item && !item.inactive);
    }

    if (resource === 'incomeCategories') {
      const includeAuxiliary =
        query.includeAuxiliary === 'true' || query.normalOnly !== 'true';
      filtered = includeAuxiliary
        ? filtered
        : filtered.filter(
            (item) => 'auxiliary' in item && !item.auxiliary,
          );
    }

    if (isIncomeBacked(resource)) {
      filtered = this.filterIncomeBacked(resource, filtered as IncomeRecordDto[], query, userId);
    }

    if (isExpenseBacked(resource)) {
      filtered = this.filterExpenseBacked(filtered as ExpenseRecordDto[], query, userId);
    }

    return clone(filtered);
  }

  private filterIncomeBacked(
    resource: ResourceName,
    records: IncomeRecordDto[],
    query: ListQuery,
    userId?: string,
  ): IncomeRecordDto[] {
    let filtered = records;

    // Workflow views (transfer, credit-card-payment, alkansya) are the Incomes
    // data source filtered to their fixed income category. Receivables are
    // Incomes with no receiving (primary) account yet.
    const mapping = this.mappingService.get(resource);
    if (mapping.fixedCategory !== undefined) {
      const categoryId = this.tryFindIncomeCategoryId(mapping.fixedCategory, userId);
      filtered = categoryId
        ? filtered.filter((record) => record.categoryId === categoryId)
        : [];
    }
    if (resource === 'receivables') {
      filtered = filtered.filter((record) => !record.accountId);
    }
    // The normal Income view excludes auxiliary/workflow-category records so
    // transfers, CC payments, savings, etc. do not appear as plain income.
    if (resource === 'incomes') {
      const auxiliaryIds = this.getAuxiliaryIncomeCategoryIds(userId);
      filtered = filtered.filter(
        (record) => !auxiliaryIds.has(record.categoryId),
      );
    }

    // Daily/Weekly/Monthly/Annually views pass an explicit [rangeStart,rangeEnd];
    // fall back to the month prefix when no range is supplied.
    if (query.rangeStart || query.rangeEnd) {
      filtered = filterByRange(filtered, 'date', query.rangeStart, query.rangeEnd);
    } else if (query.month) {
      filtered = filterByMonth(filtered, 'date', query.month);
    }
    if (query.accountId) {
      filtered = filtered.filter((record) => record.accountId === query.accountId);
    }
    if (query.categoryId) {
      filtered = filtered.filter((record) => record.categoryId === query.categoryId);
    }
    return filtered;
  }

  private tryFindIncomeCategoryId(source: string, userId?: string): string | undefined {
    const target = source.toLowerCase();
    return this.cache.getCollectedIncomeCategories(userId).find(
      (item) => item.source.toLowerCase() === target,
    )?.id;
  }

  private getAuxiliaryIncomeCategoryIds(userId?: string): Set<string> {
    return new Set(
      this.cache.getCollectedIncomeCategories(userId)
        .filter((item) => item.auxiliary)
        .map((item) => item.id),
    );
  }

  private filterExpenseBacked(
    records: ExpenseRecordDto[],
    query: ListQuery,
    userId?: string,
  ): ExpenseRecordDto[] {
    let filtered = records;
    const mode = this.normalizeExpenseViewMode(query.expenseViewMode ?? query.viewMode);
    const creditAccountIds = this.getCreditAccountIds(userId);
    const today = new Date().toISOString().slice(0, 10);

    // ── View-mode semantics (each is independent of purchase-date range unless
    //    it is one of the calendar views). ─────────────────────────────────
    switch (mode) {
      case 'unpaidPasabuy': {
        // Pasabuy-category items still owed to a pasabuyer, regardless of date:
        // the pasabuy payment is not yet fully received, OR a balance remains.
        // Installments have their own view, so exclude them here.
        const pasabuyCatId = this.tryFindExpenseCategoryId('Pasabuy', userId);
        filtered = filtered.filter(
          (r) =>
            r.categoryId === pasabuyCatId &&
            r.paymentStatus !== 'Installment' &&
            (r.pasabuyStatus !== 'Payment fully received' || r.pasabuyBalance !== 0),
        );
        break;
      }
      case 'toPay':
        // Not yet paid — Date Paid empty, regardless of purchase date.
        // Installments have their own view, so exclude them here.
        filtered = filtered.filter(
          (r) => !r.datePaid && r.paymentStatus !== 'Installment',
        );
        break;
      case 'toBuy':
        // Wishlist/planned — no purchase date (or future) OR missing category/account.
        filtered = filtered.filter(
          (r) =>
            !r.purchaseDate ||
            r.purchaseDate > today ||
            !r.categoryId ||
            !r.accountId,
        );
        break;
      case 'installments':
        // Installment plans on a credit account, regardless of purchase date.
        filtered = filtered.filter(
          (r) =>
            r.paymentStatus === 'Installment' &&
            creditAccountIds.has(r.accountId),
        );
        break;
      case 'ccTransactions':
        // Outstanding credit-card charges: unpaid or not-yet-paid on a credit
        // account. Installments have their own view, so exclude them here.
        filtered = filtered.filter(
          (r) =>
            creditAccountIds.has(r.accountId) &&
            r.paymentStatus !== 'Installment' &&
            (r.paymentStatus === 'Unpaid' || !r.datePaid),
        );
        break;
      case 'daily':
      case 'weekly':
      case 'monthly':
      case 'annually':
      default:
        if (query.rangeStart || query.rangeEnd) {
          filtered = filterByRange(filtered, 'purchaseDate', query.rangeStart, query.rangeEnd);
        } else if (query.month) {
          filtered = filterByMonth(filtered, 'purchaseDate', query.month);
        }
        break;
    }

    // ── Common secondary filters ─────────────────────────────────────────
    if (query.accountId) {
      filtered = filtered.filter((record) => record.accountId === query.accountId);
    }
    if (query.categoryId && query.categoryId !== 'all') {
      if (query.categoryId === 'withoutPasabuy') {
        const pasabuyId = this.tryFindExpenseCategoryId('Pasabuy', userId);
        filtered = filtered.filter((record) => record.categoryId !== pasabuyId);
      } else {
        filtered = filtered.filter((record) => record.categoryId === query.categoryId);
      }
    }
    if (query.pasabuyer) {
      filtered = filtered.filter((record) => record.pasabuyer === query.pasabuyer);
    }
    if (query.paymentStatus) {
      filtered = filtered.filter((record) => record.paymentStatus === query.paymentStatus);
    }
    return filtered;
  }

  private normalizeExpenseViewMode(mode?: string): string {
    switch ((mode ?? '').toLowerCase().replace(/\s+/g, '')) {
      case 'unpaidpasabuy':
        return 'unpaidPasabuy';
      case 'topay':
        return 'toPay';
      case 'tobuy':
        return 'toBuy';
      case 'installments':
      case 'installment':
        return 'installments';
      case 'unpaidcc':
      case 'cctransactions':
      case 'cctransaction':
        return 'ccTransactions';
      case 'daily':
        return 'daily';
      case 'weekly':
        return 'weekly';
      case 'monthly':
        return 'monthly';
      case 'annually':
        return 'annually';
      default:
        return 'monthly';
    }
  }

  private getCreditAccountIds(userId?: string): Set<string> {
    return new Set(
      this.cache.getCollectedAccounts(userId)
        .filter((a) => isCreditLike(a.type))
        .map((a) => a.id),
    );
  }

  private tryFindExpenseCategoryId(name: string, userId?: string): string | undefined {
    const target = name.toLowerCase();
    return this.cache.getCollectedExpenseCategories(userId).find(
      (item) => item.name.toLowerCase() === target,
    )?.id;
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

  private addSyncEvent(type: string, resource: string, description: string): void {
    this.syncEvents.push({
      id: randomUUID(),
      type,
      resource,
      description,
      timestamp: nowIso(),
    });
  }

  private logError(action: string, resource: ResourceName, error: unknown): void {
    const message = error instanceof Error ? error.message : 'Unknown error';
    this.appConfig['logger']?.error?.(`Failed to ${action} ${resource}: ${message}`);
  }
}
