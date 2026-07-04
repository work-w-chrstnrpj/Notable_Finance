import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppConfigService {
  constructor(private readonly configService: ConfigService) {}

  get nodeEnv() {
    return this.configService.get<string>('nodeEnv', 'development');
  }

  get notionTokenConfigured() {
    return Boolean(this.configService.get<string>('notion.token'));
  }

  get databaseUrlConfigured() {
    return Boolean(this.configService.get<string>('database.url'));
  }

  get missingRequiredNotionConfig() {
    const requiredPaths = [
      'notion.token',
      'notion.databases.accounts',
      'notion.databases.incomeCategories',
      'notion.databases.incomes',
      'notion.databases.expenseCategories',
      'notion.databases.expenses',
      'notion.databases.monthlyMonitoring',
    ];

    return requiredPaths.filter((path) => !this.configService.get<string>(path));
  }
}
