import { Client } from '@notionhq/client';
import { Logger } from '@nestjs/common';
import { ResourceName } from '../common/finance.types';

export interface NotionQueryOptions {
  month?: string;
  pageSize?: number;
}

export class NotionApiClient {
  private readonly logger = new Logger(NotionApiClient.name);
  readonly isConfigured = true;

  constructor(
    private readonly client: Client,
    private readonly dbIds: Partial<Record<ResourceName, string>>,
  ) {}

  getDatabaseId(resource: ResourceName): string | undefined {
    if (
      resource === 'transactions' ||
      resource === 'transfers' ||
      resource === 'creditCardPayments' ||
      resource === 'alkansya' ||
      resource === 'receivables'
    ) {
      return this.dbIds.incomes;
    }
    if (resource === 'expenseScheduler') {
      return this.dbIds.expenses;
    }
    return this.dbIds[resource];
  }

  async queryDatabase(
    resource: ResourceName,
    _options?: NotionQueryOptions,
  ): Promise<Record<string, unknown>[]> {
    const databaseId = this.getDatabaseId(resource);
    if (!databaseId) {
      this.logger.warn(`No database ID for resource: ${resource}`);
      return [];
    }

    const allPages: Record<string, unknown>[] = [];
    let cursor: string | null = null;
    let hasMore = true;

    while (hasMore) {
      const response = (await (this.client.databases.query as unknown as (
        args: Record<string, unknown>,
      ) => Promise<Record<string, unknown>>)({
        database_id: databaseId,
        start_cursor: cursor ?? undefined,
      })) as unknown as {
        results: Record<string, unknown>[];
        next_cursor: string | null;
        has_more: boolean;
      };

      allPages.push(
        ...response.results.filter(
          (p) => p.object === 'page' && !p.in_trash && !p.archived,
        ),
      );
      cursor = response.next_cursor;
      hasMore = response.has_more;
    }

    return allPages;
  }

  async retrievePage(pageId: string): Promise<Record<string, unknown>> {
    const page = await this.client.pages.retrieve({ page_id: pageId });
    return page as unknown as Record<string, unknown>;
  }

  async createPage(
    resource: ResourceName,
    properties: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const databaseId = this.getDatabaseId(resource);
    if (!databaseId) {
      throw new Error(`No database ID configured for resource: ${resource}`);
    }

    const page = await (this.client.pages.create as unknown as (
      args: Record<string, unknown>,
    ) => Promise<Record<string, unknown>>)({
      parent: { database_id: databaseId },
      properties,
    });
    return page;
  }

  async updatePage(
    pageId: string,
    properties: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const page = await (this.client.pages.update as unknown as (
      args: Record<string, unknown>,
    ) => Promise<Record<string, unknown>>)({
      page_id: pageId,
      properties,
    });
    return page;
  }
}
