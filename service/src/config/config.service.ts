import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const DEV_INSECURE_JWT_SECRET = 'development-only-secret';

@Injectable()
export class AppConfigService implements OnApplicationBootstrap {
  private readonly logger = new Logger(AppConfigService.name);

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

  /**
   * Validates all critical application configuration at startup.
   * Returns structured validation results without crashing the app.
   */
  validateStartup(): { valid: boolean; warnings: string[]; errors: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // ── Notion token ────────────────────────────────────────
    if (!this.configService.get<string>('notion.token')) {
      errors.push('NOTION_TOKEN is not configured – Notion integration will not work');
    }

    // ── Database URL ────────────────────────────────────────
    if (!this.configService.get<string>('database.url')) {
      errors.push('DATABASE_URL is not configured – PostgreSQL connection will fail');
    }

    // ── JWT secret ──────────────────────────────────────────
    const jwtSecret = this.configService.get<string>('auth.jwtSecret');
    if (!jwtSecret) {
      errors.push('JWT_SECRET is not configured – authentication will fail');
    } else if (jwtSecret === DEV_INSECURE_JWT_SECRET) {
      errors.push(
        'JWT_SECRET is set to the insecure default "development-only-secret" – generate a strong random secret for production',
      );
    }

    // ── Notion database IDs (warnings unless token is also missing) ──
    const missingDbPaths = this.missingRequiredNotionConfig.filter(
      (path) => path !== 'notion.token',
    );
    if (missingDbPaths.length > 0) {
      warnings.push(
        `Missing Notion Database IDs: ${missingDbPaths.join(', ')}`,
      );
    }

    // ── Google OAuth ────────────────────────────────────────
    if (!this.configService.get<string>('auth.googleClientId')) {
      warnings.push('GOOGLE_CLIENT_ID is not configured – Google OAuth sign-in will be unavailable');
    }
    if (!this.configService.get<string>('auth.googleClientSecret')) {
      warnings.push('GOOGLE_CLIENT_SECRET is not configured – Google OAuth sign-in will be unavailable');
    }

    // ── CORS origin ─────────────────────────────────────────
    const corsOrigin = this.configService.get<string>('corsOrigin');
    if (!corsOrigin || corsOrigin === 'http://localhost:3000') {
      warnings.push(
        'CORS_ORIGIN is not configured or uses the default http://localhost:3000 – set a production origin',
      );
    }

    return { valid: errors.length === 0, warnings, errors };
  }

  /**
   * Lifecycle hook that validates configuration after all modules are initialized
   * but before the application starts listening.
   *
   * In production, throws on critical missing config to fail fast.
   * In development, logs warnings for a smoother local experience.
   */
  onApplicationBootstrap() {
    const { valid, warnings, errors } = this.validateStartup();

    if (this.nodeEnv === 'production') {
      if (errors.length > 0) {
        const message = [
          'FATAL: Production startup configuration validation failed:',
          ...errors.map((e) => `  ✖ ${e}`),
        ].join('\n');
        this.logger.error(message);
        throw new Error(message);
      }

      if (warnings.length > 0) {
        const message = [
          'Production startup configuration warnings:',
          ...warnings.map((w) => `  ⚠ ${w}`),
        ].join('\n');
        this.logger.warn(message);
      } else {
        this.logger.log('Production configuration validation passed');
      }
    } else {
      if (errors.length > 0) {
        const message = [
          'Development startup config issues (the app may not work correctly):',
          ...errors.map((e) => `  ✖ ${e}`),
        ].join('\n');
        this.logger.warn(message);
      }
      if (warnings.length > 0) {
        warnings.forEach((w) => this.logger.warn(w));
      }
    }
  }
}
