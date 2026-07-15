import { HttpStatus, Injectable } from '@nestjs/common';
import { ApiException } from '../common/api-exception';
import { NotionApiError } from '../common/errors/notion-errors';
import {
  AccountDto,
  ExpenseCategoryDto,
  ExpenseRecordDto,
  IncomeCategoryDto,
  IncomeRecordDto,
  MonthlyMonitoringDto,
  ResourceName,
} from '../common/finance.types';
import { NotionApiClient } from './notion-api-client';
import { LiveCacheManager } from './live-cache-manager';
import { isExpenseBacked, isIncomeBacked } from './notion-resource-utils';

export type FinanceRecord =
  | AccountDto
  | IncomeCategoryDto
  | IncomeRecordDto
  | ExpenseCategoryDto
  | ExpenseRecordDto
  | MonthlyMonitoringDto;

/**
 * Owns the low-level Notion write operations: createPage, updatePage.
 * Extracted from NotionService (P4-3 step 5) so mutation I/O lives in one place.
 * Does NOT own buildNotionProperties (stays in NotionService) or validation (ValidationService).
 */
@Injectable()
export class NotionMutationService {
  constructor(
    private readonly cache: LiveCacheManager,
  ) {}

  private ensureNotionConfigured(client: NotionApiClient | null): asserts client is NotionApiClient {
    if (!client) {
      throw new ApiException(
        HttpStatus.PRECONDITION_REQUIRED,
        'NOTION_NOT_CONFIGURED',
        'Notion integration is not configured for this user. Save your Notion token and database IDs in Settings first.',
      );
    }
  }

  /**
   * Create a page and refresh the relevant cache collection.
   * Returns the raw Notion page object (caller converts to DTO).
   */
  async createPage(
    resource: ResourceName,
    properties: Record<string, unknown>,
    userId?: string,
  ): Promise<Record<string, unknown>> {
    await this.cache.loadLive(userId, resource);
    const client = await this.cache.getLiveClient(userId);
    this.ensureNotionConfigured(client);

    try {
      const page = await client.createPage(resource, properties);
      this.cache.refreshCacheFor(userId, resource);
      return page;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      const status = (err as any).status ?? (err as any).statusCode ?? 502;
      throw new NotionApiError(
        err.message || 'Notion API request failed',
        typeof status === 'number' ? status : 502,
        { resource, operation: 'create', body: (err as any).body },
      );
    }
  }

  /**
   * Update a page and refresh the relevant cache collection.
   * Returns the raw Notion page object (caller converts to DTO).
   */
  async updatePage(
    resource: ResourceName,
    id: string,
    properties: Record<string, unknown>,
    userId?: string,
  ): Promise<Record<string, unknown>> {
    await this.cache.loadLive(userId, resource);
    const client = await this.cache.getLiveClient(userId);
    this.ensureNotionConfigured(client);

    try {
      const page = await client.updatePage(id, properties);
      this.cache.refreshCacheFor(userId, resource);
      return page;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      const status = (err as any).status ?? (err as any).statusCode ?? 502;
      throw new NotionApiError(
        err.message || 'Notion API request failed',
        typeof status === 'number' ? status : 502,
        { resource, id, operation: 'update', body: (err as any).body },
      );
    }
  }

  /**
   * Soft-delete: update a page with deletion properties and refresh cache.
   * Returns the raw Notion page object (caller converts to DTO).
   */
  async deletePage(
    resource: ResourceName,
    id: string,
    softDeleteProperties: Record<string, unknown>,
    userId?: string,
  ): Promise<Record<string, unknown>> {
    await this.cache.loadLive(userId, resource);
    const client = await this.cache.getLiveClient(userId);
    this.ensureNotionConfigured(client);

    try {
      const page = await client.updatePage(id, softDeleteProperties);
      this.cache.refreshCacheFor(userId, resource);
      return page;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      const status = (err as any).status ?? (err as any).statusCode ?? 502;
      throw new NotionApiError(
        err.message || 'Notion API request failed',
        typeof status === 'number' ? status : 502,
        { resource, id, operation: 'soft-delete', body: (err as any).body },
      );
    }
  }
}
