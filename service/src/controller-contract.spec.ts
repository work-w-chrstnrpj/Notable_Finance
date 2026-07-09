import { describe, expect, it } from 'vitest';
import { DashboardController } from './dashboard/dashboard.controller';
import { MonthlyMonitoringController } from './monthly-monitoring/monthly-monitoring.controller';
import { NotionService } from './notion/notion.service';
import { SyncController } from './sync/sync.controller';
import { AppConfigService } from './config/config.service';
import { MappingService } from './mapping/mapping.service';
import { ValidationService } from './validation/validation.service';
import { NotionClientFactory } from './notion/notion-client-factory.service';

const mockConfig = {
  missingRequiredNotionConfig: ['notion.token'],
} as AppConfigService;

const mockClientFactory = {
  getClient: async () => null,
  isGloballyConfigured: false,
} as unknown as NotionClientFactory;

function makeNotionService() {
  const mapping = new MappingService();
  return new NotionService(mockConfig, mapping, new ValidationService(mapping), mockClientFactory);
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
