import { Logger } from '@nestjs/common';
import {
  AccountDto,
  ExpenseCategoryDto,
  ExpenseRecordDto,
  IncomeCategoryDto,
  IncomeRecordDto,
  ResourceName,
} from '../common/finance.types';
import { AppConfigService } from '../config/config.service';
import { NotionClientFactory } from './notion-client-factory.service';
import { NotionApiClient } from './notion-api-client';
import {
  pageToAccount,
  pageToExpenseCategory,
  pageToExpenseRecord,
  pageToIncomeCategory,
  pageToIncomeRecord,
} from './notion-property-mapper';
import { isExpenseBacked, isIncomeBacked } from './notion-resource-utils';

interface LiveCache {
  accounts: AccountDto[];
  incomeCategories: IncomeCategoryDto[];
  expenseCategories: ExpenseCategoryDto[];
  incomes: IncomeRecordDto[];
  expenses: ExpenseRecordDto[];
}

/** The five in-memory collections that back a LiveCache. */
type CollectionName =
  | 'accounts'
  | 'incomeCategories'
  | 'expenseCategories'
  | 'incomes'
  | 'expenses';

/** A record held in one of the cached collections (never MonthlyMonitoring). */
export type CachedRecord =
  | AccountDto
  | IncomeCategoryDto
  | IncomeRecordDto
  | ExpenseCategoryDto
  | ExpenseRecordDto;

/**
 * Owns the per-user in-memory Notion cache: freshness (TTL), targeted
 * invalidation, single-flight loading, and the raw collection accessors.
 * Extracted from NotionService (P4-3) so the service is smaller and the cache
 * policy lives in one cohesive place. Constructed by NotionService with the
 * same injected dependencies, so it stays a singleton per service instance.
 */
export class LiveCacheManager {
  private readonly logger = new Logger(LiveCacheManager.name);

  private liveCaches = new Map<string, LiveCache | null>();

  /**
   * Per-user, per-collection freshness deadline (epoch ms). A collection is
   * fresh while `Date.now() < freshUntil` and is served from memory; once it
   * expires — or is invalidated by a mutation (deadline deleted) — the next
   * read refills only that collection with a single Notion query. This unifies
   * TTL expiry and targeted invalidation into one model. See refreshCacheFor().
   */
  private collectionFreshUntil = new Map<string, Map<CollectionName, number>>();

  /**
   * In-flight loads keyed by `${cacheKey}:${collection}` (or `:__all__` for a
   * cold load). Concurrent readers of the same stale collection await the same
   * promise instead of each firing their own Notion query — without this, a
   * single dashboard mount fans out into a thundering herd against Notion
   * (incomes/alkansya/transfers/creditCardPayments all back the same collection)
   * once the TTL expires, tripping rate limits and 5xx responses.
   */
  private inFlightLoads = new Map<string, Promise<void>>();

  private static readonly ALL_COLLECTIONS: CollectionName[] = [
    'accounts',
    'incomeCategories',
    'expenseCategories',
    'incomes',
    'expenses',
  ];

  constructor(
    private readonly appConfig: AppConfigService,
    private readonly clientFactory: NotionClientFactory,
  ) {}

  private getLiveCacheKey(userId?: string): string {
    return userId ?? '__env__';
  }

  /** True once a non-null cache entry exists for the user. */
  hasEntry(userId?: string): boolean {
    return this.liveCaches.get(this.getLiveCacheKey(userId)) != null;
  }

  /** A collection is fresh while its per-user deadline is still in the future. */
  private isCollectionFresh(key: string, collection: CollectionName): boolean {
    const until = this.collectionFreshUntil.get(key)?.get(collection);
    return until !== undefined && Date.now() < until;
  }

  /** Extend a collection's freshness by one TTL window from now. */
  private markCollectionFresh(key: string, collection: CollectionName): void {
    let deadlines = this.collectionFreshUntil.get(key);
    if (!deadlines) {
      deadlines = new Map<CollectionName, number>();
      this.collectionFreshUntil.set(key, deadlines);
    }
    deadlines.set(collection, Date.now() + this.appConfig.liveCacheTtlMs);
  }

  private markAllCollectionsFresh(key: string): void {
    for (const collection of LiveCacheManager.ALL_COLLECTIONS) {
      this.markCollectionFresh(key, collection);
    }
  }

  /** Force a collection stale so its next read refetches it. */
  private invalidateCollection(key: string, collection: CollectionName): void {
    this.collectionFreshUntil.get(key)?.delete(collection);
  }

  /**
   * Coalesce concurrent loads under the same flight key: the first caller runs
   * `fn`, everyone else awaits its promise. Prevents duplicate Notion queries
   * (and the resulting rate-limit storms) when many requests arrive at once.
   */
  private singleFlight(flightKey: string, fn: () => Promise<void>): Promise<void> {
    const existing = this.inFlightLoads.get(flightKey);
    if (existing) return existing;
    const promise = fn().finally(() => {
      this.inFlightLoads.delete(flightKey);
    });
    this.inFlightLoads.set(flightKey, promise);
    return promise;
  }

  async loadLive(userId: string | undefined, resource: ResourceName): Promise<NotionApiClient | null> {
    const key = this.getLiveCacheKey(userId);

    // Warm cache: refill only the requested resource's collection, and only if
    // it is stale (TTL expired or invalidated by a mutation). Fresh collections
    // — including the ones this read doesn't touch — stay served from memory.
    if (this.liveCaches.has(key) && resource !== 'monthlyMonitoring') {
      const collection = this.collectionForResource(resource);
      if (
        collection &&
        this.liveCaches.get(key) &&
        !this.isCollectionFresh(key, collection)
      ) {
        const client = await this.clientFactory.getClient(userId);
        if (!client) return null;
        try {
          await this.singleFlight(`${key}:${collection}`, () =>
            this.loadLiveCollection(client, key, collection),
          );
          return client;
        } catch (error) {
          this.logger.warn(
            `Notion collection refresh failed for '${collection}', keeping prior data: ${error instanceof Error ? error.message : error}`,
          );
          return null;
        }
      }
      return null;
    }

    const client = await this.clientFactory.getClient(userId);
    if (!client) return null;

    try {
      await this.singleFlight(`${key}:__all__`, () =>
        this.loadAllCollections(client, key),
      );
      return client;
    } catch (error) {
      this.logger.warn(`Notion live load failed, falling back to static data: ${error instanceof Error ? error.message : error}`);
      this.liveCaches.set(key, null);
      return null;
    }
  }

  /**
   * Cold-start / explicit-sync loader: fetches all five collections in parallel
   * and marks them fresh. This is the only path that queries all five databases.
   */
  private async loadAllCollections(client: NotionApiClient, key: string): Promise<void> {
    const [accounts, incomeCategories, incomes, expenseCategories, expenses] =
      await Promise.all([
        client.queryDatabase('accounts'),
        client.queryDatabase('incomeCategories'),
        client.queryDatabase('incomes'),
        client.queryDatabase('expenseCategories'),
        client.queryDatabase('expenses'),
      ]);

    this.liveCaches.set(key, {
      accounts: accounts.map(pageToAccount),
      incomeCategories: incomeCategories.map(pageToIncomeCategory),
      incomes: incomes.map(pageToIncomeRecord),
      expenseCategories: expenseCategories.map(pageToExpenseCategory),
      expenses: expenses.map(pageToExpenseRecord),
    });
    this.markAllCollectionsFresh(key);
  }

  /** Refill a single cached collection with one Notion database query. */
  private async loadLiveCollection(
    client: NotionApiClient,
    key: string,
    collection: CollectionName,
  ): Promise<void> {
    const cache = this.liveCaches.get(key);
    if (!cache) return;
    switch (collection) {
      case 'accounts':
        cache.accounts = (await client.queryDatabase('accounts')).map(pageToAccount);
        break;
      case 'incomeCategories':
        cache.incomeCategories = (await client.queryDatabase('incomeCategories')).map(pageToIncomeCategory);
        break;
      case 'incomes':
        cache.incomes = (await client.queryDatabase('incomes')).map(pageToIncomeRecord);
        break;
      case 'expenseCategories':
        cache.expenseCategories = (await client.queryDatabase('expenseCategories')).map(pageToExpenseCategory);
        break;
      case 'expenses':
        cache.expenses = (await client.queryDatabase('expenses')).map(pageToExpenseRecord);
        break;
    }
    this.markCollectionFresh(key, collection);
  }

  /** Map a resource to the cached collection that backs it, if any. */
  private collectionForResource(resource: ResourceName): CollectionName | null {
    if (resource === 'accounts') return 'accounts';
    if (resource === 'incomeCategories') return 'incomeCategories';
    if (resource === 'expenseCategories') return 'expenseCategories';
    if (isIncomeBacked(resource)) return 'incomes';
    if (isExpenseBacked(resource)) return 'expenses';
    return null;
  }

  async getLiveClient(userId?: string): Promise<NotionApiClient | null> {
    const key = this.getLiveCacheKey(userId);
    if (this.liveCaches.has(key)) {
      return this.clientFactory.getClient(userId);
    }
    const client = await this.loadLive(userId, 'accounts');
    return client;
  }

  async loadLiveSingle(
    userId: string | undefined,
    resource: ResourceName,
    pageId: string,
  ): Promise<CachedRecord | null> {
    const client = await this.clientFactory.getClient(userId);
    if (!client) return null;
    try {
      const page = await client.retrievePage(pageId);
      if (resource === 'accounts') return pageToAccount(page);
      if (resource === 'incomeCategories') return pageToIncomeCategory(page);
      if (resource === 'expenseCategories') return pageToExpenseCategory(page);
      if (isIncomeBacked(resource)) return pageToIncomeRecord(page);
      if (isExpenseBacked(resource)) return pageToExpenseRecord(page);
      return null;
    } catch {
      return null;
    }
  }

  refreshCache(userId?: string): void {
    const key = this.getLiveCacheKey(userId);
    this.liveCaches.delete(key);
    this.collectionFreshUntil.delete(key);
  }

  /**
   * Targeted cache invalidation after a mutation. Marks only the mutated
   * resource's collection stale so the next read refills that one collection,
   * leaving the other four (e.g. accounts, categories) served from memory.
   *
   * Note: derived figures shown to the user (dashboard, monthly monitoring,
   * account balances) are computed client-side from income/expense records,
   * so refreshing only the mutated income/expense collection keeps them
   * consistent. If Notion-side rollups are ever surfaced directly, the TTL
   * (liveCacheTtlMs) bounds how long any collection can be stale.
   */
  refreshCacheFor(userId: string | undefined, resource: ResourceName): void {
    const key = this.getLiveCacheKey(userId);
    const cache = this.liveCaches.get(key);
    const collection = this.collectionForResource(resource);
    // No warm cache to preserve, or a resource we don't cache granularly:
    // fall back to a full clear so the next read cold-loads correctly.
    if (!cache || !collection) {
      this.refreshCache(userId);
      return;
    }
    this.invalidateCollection(key, collection);
  }

  getCollectedAccounts(userId?: string): AccountDto[] {
    return this.liveCaches.get(this.getLiveCacheKey(userId))?.accounts ?? [];
  }

  getCollectedIncomeCategories(userId?: string): IncomeCategoryDto[] {
    return this.liveCaches.get(this.getLiveCacheKey(userId))?.incomeCategories ?? [];
  }

  getCollectedIncomes(userId?: string): IncomeRecordDto[] {
    return this.liveCaches.get(this.getLiveCacheKey(userId))?.incomes ?? [];
  }

  getCollectedExpenseCategories(userId?: string): ExpenseCategoryDto[] {
    return this.liveCaches.get(this.getLiveCacheKey(userId))?.expenseCategories ?? [];
  }

  getCollectedExpenses(userId?: string): ExpenseRecordDto[] {
    return this.liveCaches.get(this.getLiveCacheKey(userId))?.expenses ?? [];
  }
}
