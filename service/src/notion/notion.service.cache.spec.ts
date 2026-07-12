import { describe, expect, it } from 'vitest';
import { AppConfigService } from '../config/config.service';
import { MappingService } from '../mapping/mapping.service';
import { ValidationService } from '../validation/validation.service';
import { NotionClientFactory } from './notion-client-factory.service';
import { NotionService } from './notion.service';

/**
 * P2 cache behaviour: verifies TTL-driven freshness and single-collection
 * refill. A counting client records how many times each Notion database is
 * queried; returning empty arrays is enough because we only assert call counts,
 * not data.
 */
class CountingClient {
  readonly isConfigured = true;
  calls: Record<string, number> = {};

  reset() {
    this.calls = {};
  }

  total() {
    return Object.values(this.calls).reduce((a, b) => a + b, 0);
  }

  async queryDatabase(resource: string): Promise<Record<string, unknown>[]> {
    this.calls[resource] = (this.calls[resource] ?? 0) + 1;
    return [];
  }

  async retrievePage(): Promise<Record<string, unknown>> {
    return {};
  }
}

function makeService(ttlMs: number) {
  const client = new CountingClient();
  const mockConfig = {
    missingRequiredNotionConfig: [],
    liveCacheTtlMs: ttlMs,
  } as unknown as AppConfigService;
  const mockFactory = {
    getClient: async () => client,
    isGloballyConfigured: true,
  } as unknown as NotionClientFactory;
  const mapping = new MappingService();
  const service = new NotionService(
    mockConfig,
    mapping,
    new ValidationService(mapping),
    mockFactory,
  );
  return { service, client };
}

describe('NotionService cache (P2)', () => {
  it('cold start queries all five databases exactly once', async () => {
    const { service, client } = makeService(60_000);
    await service.list('incomes');
    expect(client.calls).toEqual({
      accounts: 1,
      incomeCategories: 1,
      incomes: 1,
      expenseCategories: 1,
      expenses: 1,
    });
  });

  it('serves from memory within the TTL (no extra queries)', async () => {
    const { service, client } = makeService(60_000);
    await service.list('incomes'); // cold load: 5 queries
    client.reset();

    await service.list('incomes');
    await service.list('expenses');
    await service.list('accounts');

    // Everything is still fresh → zero additional Notion queries.
    expect(client.total()).toBe(0);
  });

  it('refetches only the requested collection once it is stale (TTL=0)', async () => {
    const { service, client } = makeService(0); // every collection immediately stale
    await service.list('incomes'); // cold load: 5 queries
    client.reset();

    await service.list('incomes');
    // Reading incomes must refill ONLY incomes, not the other four.
    expect(client.calls.incomes).toBe(1);
    expect(client.calls.accounts ?? 0).toBe(0);
    expect(client.calls.expenses ?? 0).toBe(0);
    expect(client.calls.incomeCategories ?? 0).toBe(0);
    expect(client.calls.expenseCategories ?? 0).toBe(0);

    client.reset();
    await service.list('expenses');
    // Now only expenses refills.
    expect(client.calls.expenses).toBe(1);
    expect(client.calls.incomes ?? 0).toBe(0);
  });

  it('income-backed workflow resources share the incomes collection', async () => {
    const { service, client } = makeService(0);
    await service.list('incomes'); // cold load
    client.reset();

    // transfers/creditCardPayments/alkansya/receivables all map to `incomes`.
    await service.list('transfers');
    expect(client.calls.incomes).toBe(1);
    expect(client.calls.accounts ?? 0).toBe(0);
  });

  it('coalesces a concurrent cold-start burst into one query per database', async () => {
    const { service, client } = makeService(60_000);
    // A dashboard mount fires many reads at once before the cache exists.
    await Promise.all([
      service.list('incomes'),
      service.list('expenses'),
      service.list('alkansya'),
      service.list('transfers'),
      service.list('accounts'),
    ]);
    // Without single-flight this would be ~25 queries (5 reads × 5 DBs).
    expect(client.calls).toEqual({
      accounts: 1,
      incomeCategories: 1,
      incomes: 1,
      expenseCategories: 1,
      expenses: 1,
    });
  });

  it('coalesces a concurrent stale income-backed burst into one query', async () => {
    const { service, client } = makeService(0); // collections immediately stale
    await service.list('incomes'); // cold load
    client.reset();

    // incomes/alkansya/transfers/creditCardPayments all back `incomes`; a single
    // dashboard mount must not fan out into four concurrent Notion queries.
    await Promise.all([
      service.list('incomes'),
      service.list('alkansya'),
      service.list('transfers'),
      service.list('creditCardPayments'),
    ]);
    expect(client.calls.incomes).toBe(1);
    expect(client.calls.accounts ?? 0).toBe(0);
  });
});
