import { describe, expect, it } from 'vitest';
import { DashboardController } from './dashboard/dashboard.controller';
import { MonthlyMonitoringController } from './monthly-monitoring/monthly-monitoring.controller';
import { NotionService } from './notion/notion.service';
import { SyncController } from './sync/sync.controller';
import { AppConfigService } from './config/config.service';
import { MappingService } from './mapping/mapping.service';
import { ValidationService } from './validation/validation.service';
import { NotionClientFactory } from './notion/notion-client-factory.service';
import { LiveCacheManager } from './notion/live-cache-manager';
import { NotionReportingService } from './notion/notion-reporting.service';
import { NotionQueryService } from './notion/notion-query.service';
import { NotionMutationService } from './notion/notion-mutation.service';
import { NotionSyncService } from './notion/notion-sync.service';

const mockConfig = {
  missingRequiredNotionConfig: ['notion.token'],
} as AppConfigService;

const mockClientFactory = {
  getClient: async () => null,
  isGloballyConfigured: false,
} as unknown as NotionClientFactory;

function makeNotionService() {
  const mapping = new MappingService();
  const cache = new LiveCacheManager(mockConfig, mockClientFactory);
  const queryService = new NotionQueryService(cache, mapping);
  const reportingService = new NotionReportingService(cache, queryService);
  const mutationService = new NotionMutationService(cache);
  const syncService = new NotionSyncService(mockConfig, mapping, mockClientFactory, cache, mutationService, queryService);
  const service = new NotionService(mockConfig, mapping, new ValidationService(mapping), mockClientFactory, cache, reportingService, queryService, mutationService, syncService);
  // Resolve circular dependency for tests
  syncService.setNotionService(service);
  return service;
}

describe('controller contracts', () => {
  it('returns sync operation failures for read-only reference mutations', async () => {
    const controller = new SyncController(makeNotionService());
    const response = await controller.commit({
      operations: [
        {
          clientOperationId: 'op-readonly',
          resource: 'accounts',
          action: 'update',
          id: 'acct-bdo-checking',
          data: { name: 'Do not write' },
        },
      ],
      returnFreshSnapshot: false,
    }, { id: 'test-user', email: 'test@test.com', roles: ['user'] });

    expect(response.failed).toEqual([
      expect.objectContaining({
        clientOperationId: 'op-readonly',
        code: 'FORBIDDEN',
      }),
    ]);
  });

  it('returns app-calculated dashboard summary data', async () => {
    const controller = new DashboardController(makeNotionService());
    const result = await controller.summary('2026-07');
    expect(result).toMatchObject({
      month: '2026-07',
      totalIncome: 102500,
      totalExpense: 24000,
    });
  });

  it('returns app-calculated monthly monitoring data', async () => {
    const controller = new MonthlyMonitoringController(makeNotionService());
    const result = await controller.list('2026-07');
    expect(result).toMatchObject({
      month: '2026-07',
      monthlyGrossIncome: 110000,
      monthlyExpense: 24000,
    });
  });
});
