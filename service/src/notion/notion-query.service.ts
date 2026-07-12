import { Injectable } from '@nestjs/common';
import { LiveCacheManager } from './live-cache-manager';
import { MappingService } from '../mapping/mapping.service';
import {
  AccountDto,
  ExpenseCategoryDto,
  ExpenseRecordDto,
  IncomeCategoryDto,
  IncomeRecordDto,
  ListQuery,
  MonthlyMonitoringDto,
  ResourceName,
} from '../common/finance.types';
import {
  filterByMonth,
  filterByRange,
  isCreditLike,
  isExpenseBacked,
  isIncomeBacked,
} from './notion-resource-utils';

/**
 * Owns query/filter logic: applyQuery, filterIncomeBacked, filterExpenseBacked,
 * view-mode normalization, category/account lookups.
 * Extracted from NotionService (P4-3 step 4) so the service is smaller
 * and query logic lives in one cohesive place.
 */
@Injectable()
export class NotionQueryService {
  constructor(
    private readonly cache: LiveCacheManager,
    private readonly mappingService: MappingService,
  ) {}

  applyQuery(
    resource: ResourceName,
    records: (AccountDto | IncomeCategoryDto | IncomeRecordDto | ExpenseCategoryDto | ExpenseRecordDto | MonthlyMonitoringDto)[],
    query: ListQuery,
    userId?: string,
  ): (AccountDto | IncomeCategoryDto | IncomeRecordDto | ExpenseCategoryDto | ExpenseRecordDto | MonthlyMonitoringDto)[] {
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

    // Deep clone to avoid accidental mutation
    return JSON.parse(JSON.stringify(filtered));
  }

  filterIncomeBacked(
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

  filterExpenseBacked(
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

  normalizeExpenseViewMode(mode?: string): string {
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

  getCreditAccountIds(userId?: string): Set<string> {
    return new Set(
      this.cache.getCollectedAccounts(userId)
        .filter((a) => isCreditLike(a.type))
        .map((a) => a.id),
    );
  }

  tryFindExpenseCategoryId(name: string, userId?: string): string | undefined {
    const target = name.toLowerCase();
    return this.cache.getCollectedExpenseCategories(userId).find(
      (item) => item.name.toLowerCase() === target,
    )?.id;
  }

  tryFindIncomeCategoryId(source: string, userId?: string): string | undefined {
    const target = source.toLowerCase();
    return this.cache.getCollectedIncomeCategories(userId).find(
      (item) => item.source.toLowerCase() === target,
    )?.id;
  }

  getAuxiliaryIncomeCategoryIds(userId?: string): Set<string> {
    return new Set(
      this.cache.getCollectedIncomeCategories(userId)
        .filter((item) => item.auxiliary)
        .map((item) => item.id),
    );
  }

  findIncomeCategoryId(source: string): string {
    const category = this.cache.getCollectedIncomeCategories().find((item) => item.source === source);
    if (!category) {
      throw new Error(`Required income category is not configured: ${source}`);
    }
    return category.id;
  }

  findExpenseCategoryId(name: string): string {
    const category = this.cache.getCollectedExpenseCategories().find((item) => item.name === name);
    if (!category) {
      throw new Error(`Required expense category is not configured: ${name}`);
    }
    return category.id;
  }
}
