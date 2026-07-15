import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from '@notionhq/client';
import { UserConfigService } from '../user-config/user-config.service';
import { NotionApiClient } from './notion-api-client';
import { ResourceName } from '../common/finance.types';

@Injectable()
export class NotionClientFactory {
  private readonly logger = new Logger(NotionClientFactory.name);
  private readonly envToken: string | null;
  private readonly envDbIds: Partial<Record<ResourceName, string>> = {};

  constructor(
    private readonly configService: ConfigService,
    private readonly userConfigService: UserConfigService,
  ) {
    this.envToken = this.configService.get<string>('notion.token') ?? null;
    this.envDbIds = {
      accounts: this.configService.get<string>('notion.databases.accounts') ?? undefined,
      incomeCategories: this.configService.get<string>('notion.databases.incomeCategories') ?? undefined,
      incomes: this.configService.get<string>('notion.databases.incomes') ?? undefined,
      expenseCategories: this.configService.get<string>('notion.databases.expenseCategories') ?? undefined,
      expenses: this.configService.get<string>('notion.databases.expenses') ?? undefined,
      monthlyMonitoring: this.configService.get<string>('notion.databases.monthlyMonitoring') ?? undefined,
    } as Partial<Record<ResourceName, string>>;
  }

  async getClient(userId?: string): Promise<NotionApiClient | null> {
    if (userId) {
      const config = await this.userConfigService.getConfig(userId);
      if (config && config.token) {
        this.logger.log(
          `Using per-user Notion config for user ${userId}. ` +
          `DB IDs: ${JSON.stringify(config.dbIds)}`,
        );
        const client = new Client({ auth: config.token });
        return new NotionApiClient(client, config.dbIds as Partial<Record<ResourceName, string>>);
      }
      if (config && !config.token) {
        this.logger.warn(
          `User ${userId} has a Notion config saved but the token is empty. ` +
          `Re-enter your Notion token in Settings to fix this.`,
        );
      }
      if (!config) {
        this.logger.warn(
          `No Notion config found for user ${userId}. ` +
          `Configure your Notion token and database IDs in Settings.`,
        );
      }
    }

    if (!userId && this.envToken) {
      this.logger.log(
        `Using env Notion config (no user context). DB IDs: ${JSON.stringify(this.envDbIds)}`,
      );
      const client = new Client({ auth: this.envToken });
      return new NotionApiClient(client, this.envDbIds);
    }

    return null;
  }

  get isGloballyConfigured(): boolean {
    return this.envToken !== null;
  }
}
