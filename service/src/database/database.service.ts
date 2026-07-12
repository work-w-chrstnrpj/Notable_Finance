import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';
import { readFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';

const MIGRATION_FILES = [
  '001-initial-schema.sql',
  '002-users-schema.sql',
  '003-user-preferences.sql',
];

function resolveMigrationDir(): string {
  const candidates = [
    join(__dirname, 'sql', 'migrations'),
    join(__dirname, '..', 'src', 'sql', 'migrations'),
    resolve('dist', 'sql', 'migrations'),
    resolve('src', 'sql', 'migrations'),
  ];
  for (const dir of candidates) {
    if (existsSync(join(dir, '001-initial-schema.sql'))) {
      return dir;
    }
  }
  return candidates[0];
}

@Injectable()
export class DatabaseService implements OnApplicationBootstrap {
  private readonly logger = new Logger(DatabaseService.name);
  private pool: Pool | null = null;

  constructor(private readonly configService: ConfigService) {
    const dbUrl = this.configService.get<string>('database.url');
    if (dbUrl) {
      this.pool = new Pool({ connectionString: dbUrl });
    }
  }

  get isConfigured(): boolean {
    return this.pool !== null;
  }

  getPool(): Pool {
    if (!this.pool) {
      throw new Error('DATABASE_URL is not configured');
    }
    return this.pool;
  }

  async query<T = Record<string, unknown>>(
    text: string,
    params: unknown[] = [],
  ): Promise<T[]> {
    const client = await this.getPool().connect();
    try {
      const result = await client.query(text, params);
      return result.rows as T[];
    } finally {
      client.release();
    }
  }

  async onApplicationBootstrap(): Promise<void> {
    if (!this.isConfigured) {
      this.logger.warn('DATABASE_URL not configured – skipping migration');
      return;
    }

    const migrationDir = resolveMigrationDir();
    this.logger.log(`Running database migrations from ${migrationDir}...`);
    for (const file of MIGRATION_FILES) {
      const filePath = join(migrationDir, file);
      try {
        const sql = readFileSync(filePath, 'utf-8');
        await this.query(sql);
        this.logger.log(`Migration applied: ${file}`);
      } catch (err) {
        this.logger.warn(
          `Migration ${file} may have already been applied: ${(err as Error).message}`,
        );
      }
    }
    this.logger.log('Database migrations complete');
  }
}
